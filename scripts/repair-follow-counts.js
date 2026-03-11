// Recounts follower/following from subcollections and fixes the cached counts.
// Usage:
//   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json node repair-follow-counts.js
//
// Get serviceAccount.json from:
//   Firebase Console → Project Settings → Service Accounts → Generate new private key

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const app = initializeApp({
  credential: applicationDefault(),
  projectId: 'dev-world-v1',
});
const db = getFirestore(app);

async function repairFollowCounts() {
  const usersSnap = await db.collection('users').get();
  console.log(`Found ${usersSnap.size} users. Repairing counts...`);

  let fixed = 0;
  let skipped = 0;

  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;
    const data = userDoc.data();

    const [followersSnap, followingSnap] = await Promise.all([
      db.collection(`users/${uid}/followers`).count().get(),
      db.collection(`users/${uid}/following`).count().get(),
    ]);

    const followerCount = followersSnap.data().count;
    const followingCount = followingSnap.data().count;

    const storedFollowers = data.followerCount ?? 0;
    const storedFollowing = data.followingCount ?? 0;

    if (followerCount !== storedFollowers || followingCount !== storedFollowing) {
      await db.doc(`users/${uid}`).update({ followerCount, followingCount });
      console.log(`  Fixed ${data.displayName || uid}: followers ${storedFollowers}→${followerCount}, following ${storedFollowing}→${followingCount}`);
      fixed++;
    } else {
      skipped++;
    }
  }

  console.log(`\nDone. Fixed: ${fixed}, Already correct: ${skipped}`);
}

repairFollowCounts().catch((err) => {
  console.error(err);
  process.exit(1);
});
