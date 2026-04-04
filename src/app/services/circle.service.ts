import { Injectable, inject } from '@angular/core';
import { Auth, authState } from '@angular/fire/auth';
import {
  Firestore,
  collection,
  collectionData,
  collectionGroup,
  doc,
  docData,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  where,
  orderBy,
  documentId,
} from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { serverTimestamp, increment } from 'firebase/firestore';
import { Observable, of, switchMap, map, combineLatest } from 'rxjs';

import {
  Circle,
  CircleMember,
  CircleMemberRole,
  CircleMemberStatus,
  CirclePost,
  CircleComment,
} from '../circles/circle.models';

@Injectable({ providedIn: 'root' })
export class CircleService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private storage = inject(Storage);

  /** All circles where current user is an active member. */
  getMyCircles$(): Observable<Circle[]> {
    return authState(this.auth).pipe(
      switchMap((user) => {
        if (!user) return of([]);
        const membersGroup = collectionGroup(this.firestore, 'members');
        const q = query(
          membersGroup,
          where('uid', '==', user.uid),
          where('status', '==', 'active'),
        );
        return collectionData(q, { idField: '_memberId' }).pipe(
          switchMap((memberDocs) => {
            if (!memberDocs.length) return of([]);
            const circleIds = memberDocs
              .map((m) => m['circleId'] as string)
              .filter(Boolean);
            if (!circleIds.length) return of([]);
            const circlesCol = collection(this.firestore, 'circles');
            const cq = query(
              circlesCol,
              where(documentId(), 'in', circleIds.slice(0, 30)),
            );
            return collectionData(cq, { idField: 'id' }) as Observable<Circle[]>;
          }),
        );
      }),
    );
  }

  /** Circles where current user has a pending invitation. */
  getMyInvitedCircles$(): Observable<Circle[]> {
    return authState(this.auth).pipe(
      switchMap((user) => {
        if (!user) return of([]);
        const membersGroup = collectionGroup(this.firestore, 'members');
        const q = query(
          membersGroup,
          where('uid', '==', user.uid),
          where('status', '==', 'invited'),
        );
        return collectionData(q, { idField: '_memberId' }).pipe(
          switchMap((memberDocs) => {
            if (!memberDocs.length) return of([]);
            const circleIds = memberDocs
              .map((m) => m['circleId'] as string)
              .filter(Boolean);
            if (!circleIds.length) return of([]);
            const circlesCol = collection(this.firestore, 'circles');
            const cq = query(
              circlesCol,
              where(documentId(), 'in', circleIds.slice(0, 30)),
            );
            return collectionData(cq, { idField: 'id' }) as Observable<Circle[]>;
          }),
        );
      }),
    );
  }

  /** Public circles for discovery. */
  getPublicCircles$(): Observable<Circle[]> {
    const circlesCol = collection(this.firestore, 'circles');
    const q = query(circlesCol, where('visibility', '==', 'public'), orderBy('createdAt', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<Circle[]>;
  }

  /** Single circle by ID. */
  getCircle$(circleId: string): Observable<Circle | undefined> {
    const circleRef = doc(this.firestore, `circles/${circleId}`);
    return docData(circleRef, { idField: 'id' }) as Observable<Circle | undefined>;
  }

  /** Members of a circle. */
  getMembers$(circleId: string): Observable<CircleMember[]> {
    const membersCol = collection(this.firestore, `circles/${circleId}/members`);
    const q = query(membersCol, orderBy('joinedAt', 'asc'));
    return collectionData(q, { idField: 'uid' }) as Observable<CircleMember[]>;
  }

  /** Current user's membership doc for a circle. */
  getMyMembership$(circleId: string): Observable<CircleMember | null> {
    return authState(this.auth).pipe(
      switchMap((user) => {
        if (!user) return of(null);
        const membersCol = collection(this.firestore, `circles/${circleId}/members`);
        const q = query(membersCol, where('uid', '==', user.uid));
        return collectionData(q, { idField: 'uid' }).pipe(
          map((docs) => (docs[0] as CircleMember) ?? null),
        );
      }),
    );
  }

  /** Create a new circle; creator becomes admin. */
  async createCircle(
    name: string,
    description: string,
    visibility: 'public' | 'private',
    bannerFile?: File | null,
  ): Promise<string> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const userRef = doc(this.firestore, `users/${user.uid}`);
    const snap = await getDoc(userRef);
    const userData = snap.exists() ? (snap.data() as any) : {};
    const displayName = userData.displayName ?? user.displayName ?? 'Unknown';
    const avatarColor = userData.avatarColor ?? null;

    let bannerUrl: string | null = null;
    if (bannerFile) {
      const storageRef = ref(
        this.storage,
        `circle-banners/${user.uid}/${Date.now()}_${bannerFile.name}`,
      );
      await uploadBytes(storageRef, bannerFile);
      bannerUrl = await getDownloadURL(storageRef);
    }

    const circlesCol = collection(this.firestore, 'circles');
    const circleRef = await addDoc(circlesCol, {
      name: name.trim(),
      description: description.trim(),
      visibility,
      bannerUrl,
      creatorId: user.uid,
      creatorName: displayName,
      creatorAvatarColor: avatarColor,
      memberCount: 0,
      createdAt: serverTimestamp(),
    });

    // Add creator as admin member
    const memberRef = doc(this.firestore, `circles/${circleRef.id}/members/${user.uid}`);
    await setDoc(memberRef, {
      uid: user.uid,
      displayName,
      avatarColor,
      role: 'admin' as CircleMemberRole,
      status: 'active' as CircleMemberStatus,
      circleId: circleRef.id,
      joinedAt: serverTimestamp(),
    });

    return circleRef.id;
  }

  /** Join a public circle (instant) or request to join a private one (pending). */
  async joinCircle(circleId: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) return;

    const circleRef = doc(this.firestore, `circles/${circleId}`);
    const circleSnap = await getDoc(circleRef);
    if (!circleSnap.exists()) return;

    const circle = circleSnap.data() as Circle;
    const userRef = doc(this.firestore, `users/${user.uid}`);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.exists() ? (userSnap.data() as any) : {};
    const displayName = userData.displayName ?? user.displayName ?? 'Unknown';
    const avatarColor = userData.avatarColor ?? null;

    const status: CircleMemberStatus = circle.visibility === 'public' ? 'active' : 'pending';

    const memberRef = doc(this.firestore, `circles/${circleId}/members/${user.uid}`);
    await setDoc(memberRef, {
      uid: user.uid,
      displayName,
      avatarColor,
      role: 'member' as CircleMemberRole,
      status,
      circleId,
      joinedAt: serverTimestamp(),
    });

    // Notify circle creator for pending requests
    if (status === 'pending') {
      const notifCol = collection(this.firestore, `users/${circle.creatorId}/notifications`);
      await addDoc(notifCol, {
        type: 'circle_join_request',
        circleId,
        circleName: circle.name,
        actorId: user.uid,
        actorName: displayName,
        createdAt: serverTimestamp(),
        read: false,
      }).catch(() => {});
    }
  }

  /** Leave a circle. */
  async leaveCircle(circleId: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) return;
    await deleteDoc(doc(this.firestore, `circles/${circleId}/members/${user.uid}`));
  }

  /** Admin approves a pending member. */
  async approveMember(circleId: string, uid: string): Promise<void> {
    const memberRef = doc(this.firestore, `circles/${circleId}/members/${uid}`);
    await updateDoc(memberRef, { status: 'active' });
  }

  /** Admin rejects a pending member. */
  async rejectMember(circleId: string, uid: string): Promise<void> {
    await deleteDoc(doc(this.firestore, `circles/${circleId}/members/${uid}`));
  }

  /** Admin invites a user to the circle. */
  async inviteMember(circleId: string, targetUid: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) return;

    const circleRef = doc(this.firestore, `circles/${circleId}`);
    const circleSnap = await getDoc(circleRef);
    if (!circleSnap.exists()) return;
    const circle = circleSnap.data() as Circle;

    const userRef = doc(this.firestore, `users/${targetUid}`);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.exists() ? (userSnap.data() as any) : {};

    const memberRef = doc(this.firestore, `circles/${circleId}/members/${targetUid}`);
    await setDoc(memberRef, {
      uid: targetUid,
      displayName: userData.displayName ?? 'Unknown',
      avatarColor: userData.avatarColor ?? null,
      role: 'member' as CircleMemberRole,
      status: 'invited' as CircleMemberStatus,
      circleId,
      joinedAt: serverTimestamp(),
    });

    // Notify the invited user
    const notifCol = collection(this.firestore, `users/${targetUid}/notifications`);
    await addDoc(notifCol, {
      type: 'circle_invite',
      circleId,
      circleName: circle.name,
      actorId: user.uid,
      actorName: user.displayName || user.email || 'Someone',
      createdAt: serverTimestamp(),
      read: false,
    }).catch(() => {});
  }

  /** Update a circle's name and optionally its banner image. */
  async updateCircle(circleId: string, name: string, bannerFile?: File | null): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    let bannerUrl: string | undefined;
    if (bannerFile) {
      const storageRef = ref(
        this.storage,
        `circle-banners/${user.uid}/${Date.now()}_${bannerFile.name}`,
      );
      await uploadBytes(storageRef, bannerFile);
      bannerUrl = await getDownloadURL(storageRef);
    }

    const circleRef = doc(this.firestore, `circles/${circleId}`);
    const updates: Record<string, unknown> = { name: name.trim() };
    if (bannerUrl !== undefined) {
      updates['bannerUrl'] = bannerUrl;
    }
    await updateDoc(circleRef, updates);
  }

  /** Accept an invitation. */
  async acceptInvite(circleId: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) return;
    const memberRef = doc(this.firestore, `circles/${circleId}/members/${user.uid}`);
    await updateDoc(memberRef, { status: 'active' });
  }

  // ── Circle Posts ──────────────────────────────────────────────

  async createCirclePost(
    circleId: string,
    text: string,
    imageFile?: File | null,
    mentionedUids?: string[],
  ): Promise<string> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const clean = text.trim();
    if (!clean && !imageFile) throw new Error('Post must have text or an image');

    const userRef = doc(this.firestore, `users/${user.uid}`);
    const snap = await getDoc(userRef);
    const userData = snap.exists() ? (snap.data() as any) : null;

    let imageUrl: string | null = null;
    if (imageFile) {
      const storageRef = ref(
        this.storage,
        `circle-posts/${circleId}/${user.uid}/${Date.now()}_${imageFile.name}`,
      );
      await uploadBytes(storageRef, imageFile);
      imageUrl = await getDownloadURL(storageRef);
    }

    const postsCol = collection(this.firestore, `circles/${circleId}/posts`);
    const docRef = await addDoc(postsCol, {
      text: clean,
      authorId: user.uid,
      authorName: user.email,
      authorDisplayName: userData?.displayName ?? null,
      authorAvatarColor: userData?.avatarColor ?? null,
      createdAt: serverTimestamp(),
      likeCount: 0,
      commentCount: 0,
      ...(imageUrl ? { imageUrl } : {}),
      ...(mentionedUids?.length ? { mentionedUids } : {}),
    });
    return docRef.id;
  }

  getCirclePosts$(circleId: string): Observable<CirclePost[]> {
    const postsCol = collection(this.firestore, `circles/${circleId}/posts`);
    const q = query(postsCol, orderBy('createdAt', 'desc'));
    return (collectionData(q, { idField: 'id' }) as Observable<CirclePost[]>).pipe(
      map((posts) =>
        posts.map((p: any) => ({
          ...p,
          createdAt: p.createdAt?.toDate ? p.createdAt.toDate() : p.createdAt,
        })),
      ),
    );
  }

  async toggleCirclePostLike(circleId: string, postId: string): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) return;

    const likeRef = doc(this.firestore, `circles/${circleId}/posts/${postId}/likes/${user.uid}`);
    const postRef = doc(this.firestore, `circles/${circleId}/posts/${postId}`);
    const likeSnap = await getDoc(likeRef);

    if (likeSnap.exists()) {
      await deleteDoc(likeRef);
      await updateDoc(postRef, { likeCount: increment(-1) });
    } else {
      await setDoc(likeRef, { createdAt: serverTimestamp(), userId: user.uid });
      await updateDoc(postRef, { likeCount: increment(1) });
    }
  }

  async hasLikedCirclePost(circleId: string, postId: string): Promise<boolean> {
    const user = this.auth.currentUser;
    if (!user) return false;
    const likeRef = doc(this.firestore, `circles/${circleId}/posts/${postId}/likes/${user.uid}`);
    const snap = await getDoc(likeRef);
    return snap.exists();
  }

  async addCircleComment(
    circleId: string,
    postId: string,
    text: string,
    mentionedUids?: string[],
  ): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const clean = text.trim();
    if (!clean) return;

    const postRef = doc(this.firestore, `circles/${circleId}/posts/${postId}`);
    const userRef = doc(this.firestore, `users/${user.uid}`);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.exists() ? (userSnap.data() as any) : null;

    const commentsCol = collection(
      this.firestore,
      `circles/${circleId}/posts/${postId}/comments`,
    );
    await addDoc(commentsCol, {
      text: clean,
      authorId: user.uid,
      authorName: user.displayName || user.email || null,
      authorAvatarColor: userData?.avatarColor ?? null,
      createdAt: serverTimestamp(),
      ...(mentionedUids?.length ? { mentionedUids } : {}),
    });

    await updateDoc(postRef, { commentCount: increment(1) });
  }

  getCircleComments$(circleId: string, postId: string): Observable<CircleComment[]> {
    const commentsCol = collection(
      this.firestore,
      `circles/${circleId}/posts/${postId}/comments`,
    );
    const q = query(commentsCol, orderBy('createdAt', 'asc'));
    return collectionData(q, { idField: 'id' }) as Observable<CircleComment[]>;
  }

  async deleteCirclePost(circleId: string, postId: string): Promise<void> {
    await deleteDoc(doc(this.firestore, `circles/${circleId}/posts/${postId}`));
  }

  async updateCirclePost(circleId: string, postId: string, text: string): Promise<void> {
    const postRef = doc(this.firestore, `circles/${circleId}/posts/${postId}`);
    await updateDoc(postRef, { text: text.trim() });
  }
}
