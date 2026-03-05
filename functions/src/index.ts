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
