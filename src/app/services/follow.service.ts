import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  addDoc,
} from '@angular/fire/firestore';
import { Auth, authState } from '@angular/fire/auth';
import { serverTimestamp, runTransaction } from 'firebase/firestore';
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
    const notifCol = collection(this.firestore, `users/${targetUid}/notifications`);

    // Only create the relationship docs — counts are maintained by Cloud Functions
    // triggered on these subcollection writes, so they can never drift.
    await runTransaction(this.firestore, async (tx) => {
      const alreadyFollowing = await tx.get(myFollowingRef);
      if (alreadyFollowing.exists()) return;

      tx.set(myFollowingRef, { createdAt: serverTimestamp() });
      tx.set(theirFollowersRef, { createdAt: serverTimestamp() });
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

    // Only delete the relationship docs — counts updated by Cloud Functions.
    await runTransaction(this.firestore, async (tx) => {
      const followSnap = await tx.get(myFollowingRef);
      if (!followSnap.exists()) return;

      tx.delete(myFollowingRef);
      tx.delete(theirFollowersRef);
    });
  }
}
