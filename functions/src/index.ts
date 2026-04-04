import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express from 'express';
import { mountHiyveRoutes, loadHiyveConfig } from '@hiyve/admin';

admin.initializeApp();

const app = express();
app.use(express.json());

const apiRouter = express.Router();
mountHiyveRoutes(apiRouter, loadHiyveConfig());
app.use('/api', apiRouter);

export const api = functions.https.onRequest(app);

// Triggered whenever a user document is updated.
// Propagates displayName / avatarColor changes to all denormalized copies
// in posts, comments, and conversations.
export const syncProfileToContent = functions.firestore
  .document('users/{uid}')
  .onUpdate(async (change, context) => {
    const uid = context.params['uid'] as string;
    const before = change.before.data();
    const after = change.after.data();

    const nameChanged = before['displayName'] !== after['displayName'];
    const colorChanged = before['avatarColor'] !== after['avatarColor'];

    if (!nameChanged && !colorChanged) return null;

    const db = admin.firestore();
    const writes: { ref: admin.firestore.DocumentReference; data: Record<string, unknown> }[] = [];

    // 1. Posts — authorDisplayName + authorAvatarColor
    const postsSnap = await db.collection('posts').where('authorId', '==', uid).get();
    for (const postDoc of postsSnap.docs) {
      const data: Record<string, unknown> = {};
      if (nameChanged) data['authorDisplayName'] = after['displayName'] ?? null;
      if (colorChanged) data['authorAvatarColor'] = after['avatarColor'] ?? null;
      writes.push({ ref: postDoc.ref, data });
    }

    // 2. Comments (collection group) — authorName + authorAvatarColor
    const commentsSnap = await db.collectionGroup('comments').where('authorId', '==', uid).get();
    for (const commentDoc of commentsSnap.docs) {
      const data: Record<string, unknown> = {};
      if (nameChanged) data['authorName'] = after['displayName'] ?? null;
      if (colorChanged) data['authorAvatarColor'] = after['avatarColor'] ?? null;
      writes.push({ ref: commentDoc.ref, data });
    }

    // 3. Conversations — participantNames.{uid} + participantColors.{uid}
    const convosSnap = await db
      .collection('conversations')
      .where('participantIds', 'array-contains', uid)
      .get();
    for (const convoDoc of convosSnap.docs) {
      const data: Record<string, unknown> = {};
      if (nameChanged) data[`participantNames.${uid}`] = after['displayName'] ?? null;
      if (colorChanged) data[`participantColors.${uid}`] = after['avatarColor'] ?? null;
      writes.push({ ref: convoDoc.ref, data });
    }

    // 4. Circle member docs — displayName + avatarColor
    const circleMembersSnap = await db
      .collectionGroup('members')
      .where('uid', '==', uid)
      .get();
    for (const memberDoc of circleMembersSnap.docs) {
      // Only update circle member docs (path: circles/{id}/members/{uid})
      if (!memberDoc.ref.parent.parent?.parent.id) continue;
      if (memberDoc.ref.parent.parent.parent.id !== 'circles') continue;
      const data: Record<string, unknown> = {};
      if (nameChanged) data['displayName'] = after['displayName'] ?? null;
      if (colorChanged) data['avatarColor'] = after['avatarColor'] ?? null;
      writes.push({ ref: memberDoc.ref, data });
    }

    if (writes.length === 0) return null;

    // Commit in batches of 500 (Firestore limit per batch)
    const BATCH_SIZE = 500;
    for (let i = 0; i < writes.length; i += BATCH_SIZE) {
      const batch = db.batch();
      for (const { ref, data } of writes.slice(i, i + BATCH_SIZE)) {
        batch.update(ref, data);
      }
      await batch.commit();
    }

    functions.logger.info(`syncProfileToContent: uid=${uid} updated ${writes.length} docs`, {
      nameChanged,
      colorChanged,
    });

    return null;
  });

// Maintain memberCount on the circle whenever a member doc is created/deleted
// and only count members with status === 'active'.
export const onCircleMemberWrite = functions.firestore
  .document('circles/{circleId}/members/{uid}')
  .onWrite(async (change, context) => {
    const circleId = context.params['circleId'] as string;
    const beforeData = change.before.exists ? change.before.data() : null;
    const afterData = change.after.exists ? change.after.data() : null;

    const wasCounted = beforeData?.status === 'active';
    const isCounted = afterData?.status === 'active';

    if (wasCounted === isCounted) return null;

    const delta = isCounted ? 1 : -1;
    await admin.firestore().doc(`circles/${circleId}`).update({
      memberCount: admin.firestore.FieldValue.increment(delta),
    });
    return null;
  });

// Maintain followerCount on the target user whenever a follower doc is written or deleted.
// Using the subcollection doc as the source of truth means counts can never drift —
// every follow/unfollow is reflected here regardless of whether the client succeeded.
export const onFollowerWrite = functions.firestore
  .document('users/{uid}/followers/{followerId}')
  .onWrite(async (change, context) => {
    const uid = context.params['uid'] as string;
    const created = !change.before.exists && change.after.exists;
    const deleted = change.before.exists && !change.after.exists;
    if (!created && !deleted) return null;

    const delta = created ? 1 : -1;
    await admin.firestore().doc(`users/${uid}`).update({
      followerCount: admin.firestore.FieldValue.increment(delta),
    });
    return null;
  });

// Maintain followingCount on the acting user whenever a following doc is written or deleted.
export const onFollowingWrite = functions.firestore
  .document('users/{uid}/following/{targetId}')
  .onWrite(async (change, context) => {
    const uid = context.params['uid'] as string;
    const created = !change.before.exists && change.after.exists;
    const deleted = change.before.exists && !change.after.exists;
    if (!created && !deleted) return null;

    const delta = created ? 1 : -1;
    await admin.firestore().doc(`users/${uid}`).update({
      followingCount: admin.firestore.FieldValue.increment(delta),
    });
    return null;
  });

// Run once to repair circle memberCount values.
export const repairCircleMemberCounts = functions.https.onCall(async (
  _data: unknown,
  context: functions.https.CallableContext,
) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');

  const db = admin.firestore();
  const circlesSnap = await db.collection('circles').get();

  const results = await Promise.all(
    circlesSnap.docs.map(async (circleDoc: admin.firestore.QueryDocumentSnapshot) => {
      const circleId = circleDoc.id;
      const membersSnap = await db
        .collection(`circles/${circleId}/members`)
        .where('status', '==', 'active')
        .count()
        .get();
      const memberCount = membersSnap.data().count;
      await db.doc(`circles/${circleId}`).update({ memberCount });
      return { circleId, memberCount };
    }),
  );

  return { repaired: results.length, circles: results };
});

// Run once to repair follower/following counts that drifted out of sync.
// Call via: firebase functions:call repairFollowCounts (or HTTP GET with ?secret=...)
export const repairFollowCounts = functions.https.onCall(async (
  _data: unknown,
  context: functions.https.CallableContext,
) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');

  const db = admin.firestore();
  const usersSnap = await db.collection('users').get();

  const results = await Promise.all(
    usersSnap.docs.map(async (userDoc: admin.firestore.QueryDocumentSnapshot) => {
      const uid = userDoc.id;
      const [followersSnap, followingSnap] = await Promise.all([
        db.collection(`users/${uid}/followers`).count().get(),
        db.collection(`users/${uid}/following`).count().get(),
      ]);
      const followerCount = followersSnap.data().count;
      const followingCount = followingSnap.data().count;
      await db.doc(`users/${uid}`).update({ followerCount, followingCount });
      return { uid, followerCount, followingCount };
    }),
  );

  return { repaired: results.length, users: results };
});

