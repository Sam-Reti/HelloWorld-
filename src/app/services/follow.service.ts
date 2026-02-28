import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  addDoc,
} from '@angular/fire/firestore';
import { Auth, authState } from '@angular/fire/auth';
import { increment, serverTimestamp } from 'firebase/firestore';
import { Observable, of, switchMap, map } from 'rxjs';

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

  getAllUsers$(): Observable<PublicUser[]> {
    return authState(this.auth).pipe(
      switchMap((user) => {
        const usersCol = collection(this.firestore, 'users');
        return collectionData(usersCol, { idField: 'uid' }) as Observable<PublicUser[]>;
      }),
    );
  }

  async follow(targetUid: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user || user.uid === targetUid) return;

    const myFollowingRef = doc(this.firestore, `users/${user.uid}/following/${targetUid}`);
    const theirFollowersRef = doc(this.firestore, `users/${targetUid}/followers/${user.uid}`);
    const myRef = doc(this.firestore, `users/${user.uid}`);
    const theirRef = doc(this.firestore, `users/${targetUid}`);
    const notifCol = collection(this.firestore, `users/${targetUid}/notifications`);

    await setDoc(myFollowingRef, { createdAt: serverTimestamp() });
    await setDoc(theirFollowersRef, { createdAt: serverTimestamp() });
    await updateDoc(myRef, { followingCount: increment(1) });
    await updateDoc(theirRef, { followerCount: increment(1) });

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

    await deleteDoc(myFollowingRef);
    await deleteDoc(theirFollowersRef);
    await updateDoc(myRef, { followingCount: increment(-1) });
    await updateDoc(theirRef, { followerCount: increment(-1) });
  }
}
