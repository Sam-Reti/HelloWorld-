import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { Auth } from '@angular/fire/auth';
import {
  query,
  orderBy,
  where,
  getDocs,
  startAfter,
  limit,
  QueryDocumentSnapshot,
  DocumentData,
  QueryConstraint,
} from 'firebase/firestore';
import { collectionData } from '@angular/fire/firestore';
import { combineLatest, map, Observable, of } from 'rxjs';
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
  authorDisplayName?: string | null;
  authorAvatarColor?: string | null;
  imageUrl?: string | null;
  type?: 'practice' | 'code';
  codeLanguage?: string;
  codeContent?: string;
  practiceLanguage?: string;
  practiceCategory?: string;
  practiceLevel?: string;
  practiceScore?: number;
  practiceGrade?: string;
  practiceFeedback?: string;
  practiceChallenge?: string;
  practiceDescription?: string;
  practiceSubmission?: string;
  practiceCorrectedCode?: string;
};

export type PracticeShareData = {
  language: string;
  category: string;
  level: string;
  score: number;
  grade: string;
  feedback: string;
  challenge: string;
  description: string;
  submission: string;
  correctedCode: string;
};

export type Comment = {
  id?: string;
  text: string;
  authorId: string;
  authorName: string | null;
  createdAt: any;
  authorAvatarColor?: string | null;
};

@Injectable({
  providedIn: 'root',
})
export class PostService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private storage = inject(Storage);

  async createPost(text: string, imageFile?: File | null): Promise<string> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const clean = text.trim();
    if (!clean && !imageFile) throw new Error('Post must have text or an image');

    const userRef = doc(this.firestore, `users/${user.uid}`);
    const snap = await getDoc(userRef);
    const userData = snap.exists() ? (snap.data() as any) : null;
    const displayName = userData?.displayName ?? null;
    const avatarColor = userData?.avatarColor ?? null;

    let imageUrl: string | null = null;
    if (imageFile) {
      const storageRef = ref(this.storage, `post-images/${user.uid}/${Date.now()}_${imageFile.name}`);
      await uploadBytes(storageRef, imageFile);
      imageUrl = await getDownloadURL(storageRef);
    }

    const postsRef = collection(this.firestore, 'posts');
    const docRef = await addDoc(postsRef, {
      text: clean,
      authorId: user.uid,
      authorName: user.email,
      authorDisplayName: displayName,
      authorAvatarColor: avatarColor,
      createdAt: serverTimestamp(),
      likeCount: 0,
      commentCount: 0,
      ...(imageUrl ? { imageUrl } : {}),
    });
    return docRef.id;
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

  async createPracticePost(session: PracticeShareData, caption = ''): Promise<string> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const userRef = doc(this.firestore, `users/${user.uid}`);
    const snap = await getDoc(userRef);
    const userData = snap.exists() ? (snap.data() as any) : null;
    const displayName = userData?.displayName ?? null;
    const avatarColor = userData?.avatarColor ?? null;

    const postsRef = collection(this.firestore, 'posts');
    const docRef = await addDoc(postsRef, {
      text: caption,
      type: 'practice',
      authorId: user.uid,
      authorName: user.email,
      authorDisplayName: displayName,
      authorAvatarColor: avatarColor,
      createdAt: serverTimestamp(),
      likeCount: 0,
      commentCount: 0,
      practiceLanguage: session.language,
      practiceCategory: session.category,
      practiceLevel: session.level,
      practiceScore: session.score,
      practiceGrade: session.grade,
      practiceFeedback: session.feedback,
      practiceChallenge: session.challenge,
      practiceDescription: session.description,
      practiceSubmission: session.submission,
      practiceCorrectedCode: session.correctedCode,
    });
    return docRef.id;
  }

  async createCodePost(code: string, language: string, caption = ''): Promise<string> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const userRef = doc(this.firestore, `users/${user.uid}`);
    const snap = await getDoc(userRef);
    const userData = snap.exists() ? (snap.data() as any) : null;
    const displayName = userData?.displayName ?? null;
    const avatarColor = userData?.avatarColor ?? null;

    const postsRef = collection(this.firestore, 'posts');
    const docRef = await addDoc(postsRef, {
      text: caption,
      type: 'code',
      codeLanguage: language,
      codeContent: code,
      authorId: user.uid,
      authorName: user.email,
      authorDisplayName: displayName,
      authorAvatarColor: avatarColor,
      createdAt: serverTimestamp(),
      likeCount: 0,
      commentCount: 0,
    });
    return docRef.id;
  }

  async updatePost(postId: string, text: string) {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    const postRef = doc(this.firestore, `posts/${postId}`);
    await updateDoc(postRef, { text: text.trim() });
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
    await setDoc(likeRef, { createdAt: serverTimestamp(), userId: user.uid, postId });
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
    const userRef = doc(this.firestore, `users/${user.uid}`);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.exists() ? (userSnap.data() as any) : null;

    const commentsRef = collection(this.firestore, `posts/${postId}/comments`);
    const commentDoc = await addDoc(commentsRef, {
      text: clean,
      authorId: user.uid,
      authorName: user.displayName || user.email || null,
      authorAvatarColor: userData?.avatarColor ?? null,
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

  async getPostsPage(
    uids: string[],
    pageSize = 30,
    cursors: (QueryDocumentSnapshot<DocumentData> | null)[] = [],
  ): Promise<{
    posts: Post[];
    cursors: (QueryDocumentSnapshot<DocumentData> | null)[];
    hasMore: boolean;
  }> {
    if (!uids.length) return { posts: [], cursors: [], hasMore: false };

    const chunks = this.chunkArray(uids, 30);
    const postsRef = collection(this.firestore, 'posts');

    const chunkResults = await Promise.all(
      chunks.map(async (chunk, i) => {
        const cursor = cursors[i] ?? null;
        const constraints: QueryConstraint[] = [
          where('authorId', 'in', chunk),
          orderBy('createdAt', 'desc'),
          limit(pageSize),
        ];
        if (cursor) constraints.push(startAfter(cursor));
        const snap = await getDocs(query(postsRef, ...constraints));
        return {
          posts: snap.docs.map((d) => ({ id: d.id, ...d.data() } as Post)),
          lastDoc: snap.docs[snap.docs.length - 1] ?? null,
          hasMore: snap.docs.length === pageSize,
        };
      }),
    );

    const allPosts = chunkResults
      .flatMap((r) => r.posts)
      .map((p: any) => ({
        ...p,
        createdAt: p.createdAt?.toDate ? p.createdAt.toDate() : p.createdAt,
      }))
      .sort((a, b) => {
        const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
        const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
        return bTime - aTime;
      });

    return {
      posts: allPosts,
      cursors: chunkResults.map((r) => r.lastDoc),
      hasMore: chunkResults.some((r) => r.hasMore),
    };
  }

  getPostsFromUsers(uids: string[]): Observable<Post[]> {
    if (!uids.length) return of([]);

    const chunks = this.chunkArray(uids, 30);
    const postsRef = collection(this.firestore, 'posts');

    const chunkQueries = chunks.map((chunk) => {
      const q = query(postsRef, where('authorId', 'in', chunk));
      return collectionData(q, { idField: 'id' }).pipe(
        map((posts: any[]) =>
          posts.map((post) => ({
            ...post,
            createdAt: post.createdAt?.toDate ? post.createdAt.toDate() : post.createdAt,
          })),
        ),
      );
    });

    return combineLatest(chunkQueries).pipe(
      map((arrays) =>
        arrays.flat().sort((a, b) => {
          const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
          const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
          return bTime - aTime;
        }),
      ),
    );
  }

  private chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }

  getComments(postId: string) {
    const commentsRef = collection(this.firestore, `posts/${postId}/comments`);
    const q = query(commentsRef, orderBy('createdAt', 'asc'));

    return collectionData(q, { idField: 'id' }) as Observable<Comment[]>;
  }

  /** Check if the current user has liked a specific post */
  async hasLiked(postId: string): Promise<boolean> {
    const user = this.auth.currentUser;
    if (!user) return false;
    const likeRef = doc(this.firestore, `posts/${postId}/likes/${user.uid}`);
    const snap = await getDoc(likeRef);
    return snap.exists();
  }
}
