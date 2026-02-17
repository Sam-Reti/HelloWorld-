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

    if (likeSnap.exists()) {
      // Unlike
      await deleteDoc(likeRef);
      await updateDoc(postRef, {
        likeCount: increment(-1),
      });
    } else {
      // Like
      await setDoc(likeRef, {
        createdAt: new Date(),
      });
      await updateDoc(postRef, {
        likeCount: increment(1),
      });
    }
  }

  async addComment(postId: string, text: string) {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    const clean = text.trim();
    if (!clean) return;

    const commentsRef = collection(this.firestore, `posts/${postId}/comments`);
    await addDoc(commentsRef, {
      text: clean,
      authorId: user.uid,
      authorName: user.email,
      createdAt: serverTimestamp(),
    });

    const postRef = doc(this.firestore, `posts/${postId}`);
    await updateDoc(postRef, { commentCount: increment(1) });
  }
  getComments(postId: string) {
    const commentsRef = collection(this.firestore, `posts/${postId}/comments`);
    const q = query(commentsRef, orderBy('createdAt', 'asc'));

    return collectionData(q, { idField: 'id' }) as Observable<Comment[]>;
  }
}
