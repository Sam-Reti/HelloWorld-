import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { query, orderBy } from 'firebase/firestore';
import { collectionData } from '@angular/fire/firestore';
import { map, Observable } from 'rxjs';
import { doc, updateDoc } from '@angular/fire/firestore';
import { increment, serverTimestamp } from 'firebase/firestore';
import { deleteDoc, getDoc, setDoc } from 'firebase/firestore';

export type Post = {
  id?: string;
  text: string;
  authorId: string;
  authorName: string | null;
  createdAt: any;
  likeCount: number;
  commentCount: number;
  authorDisplayName?: string | null; // ✅ add this
};

export type Comment = {
  id?: string;
  text: string;
  authorId: string;
  authorName: string | null;
  createdAt: any;
};

@Injectable({
  providedIn: 'root',
})
export class PostService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  async createPost(text: string) {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const clean = text.trim();
    if (!clean) return;

    // pull displayName from /users/{uid}
    const userRef = doc(this.firestore, `users/${user.uid}`);
    const snap = await getDoc(userRef);
    const displayName = snap.exists() ? ((snap.data() as any).displayName ?? null) : null;

    const postsRef = collection(this.firestore, 'posts');

    await addDoc(postsRef, {
      text: clean,
      authorId: user.uid,
      authorName: user.email, // optional
      authorDisplayName: displayName, // ✅ store it
      createdAt: serverTimestamp(), // better than new Date()
      likeCount: 0,
      commentCount: 0,
    });
  }

  getPosts() {
    const postsRef = collection(this.firestore, 'posts');
    const q = query(postsRef, orderBy('createdAt', 'desc'));

    return collectionData(q, { idField: 'id' }).pipe(
      map((posts: any[]) =>
        posts.map((post) => ({
          ...post,
          createdAt: post.createdAt?.toDate ? post.createdAt.toDate() : post.createdAt,
        })),
      ),
    );
  }

  async deletePost(postId: string) {
    const postRef = doc(this.firestore, `posts/${postId}`);
    await deleteDoc(postRef);
  }

  async toggleLike(postId: string) {
    const user = this.auth.currentUser;
    if (!user) return;

    const likeRef = doc(this.firestore, `posts/${postId}/likes/${user.uid}`);
    const postRef = doc(this.firestore, `posts/${postId}`);

    const likeSnap = await getDoc(likeRef);
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) return;

    const post = postSnap.data() as any;
    const postAuthorId = post.authorId as string | undefined;
    if (!postAuthorId) return;

    if (likeSnap.exists()) {
      // Unlike
      await deleteDoc(likeRef);
      await updateDoc(postRef, { likeCount: increment(-1) });
      return;
    }

    // Like
    await setDoc(likeRef, { createdAt: serverTimestamp() });
    await updateDoc(postRef, { likeCount: increment(1) });

    // Notify (only if not liking your own post)
    if (postAuthorId !== user.uid) {
      const notifCol = collection(this.firestore, `users/${postAuthorId}/notifications`);

      await addDoc(notifCol, {
        type: 'like',
        postId,
        actorId: user.uid,
        actorName: user.displayName || user.email || null,
        createdAt: serverTimestamp(),
        read: false,
      }).catch((e) => console.error('like notif failed', e));
    }
  }

  async addComment(postId: string, text: string) {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const clean = text.trim();
    if (!clean) return;

    const postRef = doc(this.firestore, `posts/${postId}`);
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) return;

    const post = postSnap.data() as any;
    const postAuthorId = post.authorId as string | undefined;
    if (!postAuthorId) return;

    // 1) create comment
    const commentsRef = collection(this.firestore, `posts/${postId}/comments`);
    const commentDoc = await addDoc(commentsRef, {
      text: clean,
      authorId: user.uid,
      authorName: user.email,
      createdAt: serverTimestamp(),
    });

    // 2) increment count
    await updateDoc(postRef, { commentCount: increment(1) });

    // 3) notify post author (not yourself)
    if (postAuthorId !== user.uid) {
      const notifId = `comment_${postId}_${commentDoc.id}`;
      const notifRef = doc(this.firestore, `users/${postAuthorId}/notifications/${notifId}`);

      await setDoc(notifRef, {
        type: 'comment',
        postId,
        commentId: commentDoc.id,
        actorId: user.uid,
        actorName: user.displayName || user.email || null,
        createdAt: serverTimestamp(),
        read: false,
      }).catch(() => {});
    }
  }

  getComments(postId: string) {
    const commentsRef = collection(this.firestore, `posts/${postId}/comments`);
    const q = query(commentsRef, orderBy('createdAt', 'asc'));

    return collectionData(q, { idField: 'id' }) as Observable<Comment[]>;
  }
}
