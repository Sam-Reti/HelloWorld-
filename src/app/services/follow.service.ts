import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  addDoc,
} from '@angular/fire/firestore';
import { Auth, authState } from '@angular/fire/auth';
import { increment, serverTimestamp, runTransaction } from 'firebase/firestore';
import { Observable, of, switchMap, map, shareReplay } from 'rxjs';

export interface PublicUser {
  uid: string;
  displayName: string;
  bio: string;
  followerCount: number;
  followingCount: number;
  role?: string;
  skillLevel?: string;
  languages?: string[];
  githubUrl?: string;
  websiteUrl?: string;
  location?: string;
  avatarColor?: string;
  email?: string;
  showEmail?: boolean;
}

@Injectable({ providedIn: 'root' })
export class FollowService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  getFollowingIds$(): Observable<string[]> {
    return authState(this.auth).pipe(
      switchMap((user) => {
        if (!user) return of([]);
        const followingCol = collection(this.firestore, `users/${user.uid}/following`);
        return collectionData(followingCol, { idField: 'uid' }).pipe(
          map((docs) => docs.map((d) => d['uid'] as string)),
        );
      }),
    );
  }

  isFollowing$(targetUid: string): Observable<boolean> {
    return this.getFollowingIds$().pipe(map((ids) => ids.includes(targetUid)));
  }

  private allUsers$ = authState(this.auth).pipe(
    switchMap((user) => {
      if (!user) return of([] as PublicUser[]);
      const usersCol = collection(this.firestore, 'users');
      return collectionData(usersCol, { idField: 'uid' }) as Observable<PublicUser[]>;
    }),
    shareReplay(1),
  );

  getAllUsers$(): Observable<PublicUser[]> {
    return this.allUsers$;
  }

  async follow(targetUid: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user || user.uid === targetUid) return;

    const myFollowingRef = doc(this.firestore, `users/${user.uid}/following/${targetUid}`);
    const theirFollowersRef = doc(this.firestore, `users/${targetUid}/followers/${user.uid}`);
    const myRef = doc(this.firestore, `users/${user.uid}`);
    const theirRef = doc(this.firestore, `users/${targetUid}`);
    const notifCol = collection(this.firestore, `users/${targetUid}/notifications`);

    await runTransaction(this.firestore, async (tx) => {
      const alreadyFollowing = await tx.get(myFollowingRef);
      if (alreadyFollowing.exists()) return;

      tx.set(myFollowingRef, { createdAt: serverTimestamp() });
      tx.set(theirFollowersRef, { createdAt: serverTimestamp() });
      tx.set(myRef, { followingCount: increment(1) }, { merge: true });
      tx.set(theirRef, { followerCount: increment(1) }, { merge: true });
    });

    // Notification is non-critical — outside transaction
    await addDoc(notifCol, {
      type: 'follow',
      actorId: user.uid,
      actorName: user.displayName || user.email || null,
      createdAt: serverTimestamp(),
      read: false,
    }).catch((e) => console.error('follow notif failed', e));
  }

  async unfollow(targetUid: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user || user.uid === targetUid) return;

    const myFollowingRef = doc(this.firestore, `users/${user.uid}/following/${targetUid}`);
    const theirFollowersRef = doc(this.firestore, `users/${targetUid}/followers/${user.uid}`);
    const myRef = doc(this.firestore, `users/${user.uid}`);
    const theirRef = doc(this.firestore, `users/${targetUid}`);

    await runTransaction(this.firestore, async (tx) => {
      const [followSnap, mySnap, theirSnap] = await Promise.all([
        tx.get(myFollowingRef),
        tx.get(myRef),
        tx.get(theirRef),
      ]);

      if (!followSnap.exists()) return;

      const myCount = (mySnap.data() as any)?.followingCount ?? 0;
      const theirCount = (theirSnap.data() as any)?.followerCount ?? 0;

      tx.delete(myFollowingRef);
      tx.delete(theirFollowersRef);
      tx.update(myRef, { followingCount: Math.max(0, myCount - 1) });
      tx.update(theirRef, { followerCount: Math.max(0, theirCount - 1) });
    });
  }
}
