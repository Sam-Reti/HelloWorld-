import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { query, orderBy, limit } from 'firebase/firestore';
import { Auth, authState } from '@angular/fire/auth';
import { Observable, of, combineLatest, map, switchMap } from 'rxjs';
import { PublicUser } from './follow.service';
import { Post } from './postservice';

export interface SearchResults {
  people: PublicUser[];
  posts: Post[];
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  /**
   * Client-side search: loads recent users & posts, filters by term.
   * Good enough for a small-to-medium community. For scale, swap to
   * Algolia / Typesense / Cloud Functions.
   */
  search(term: string): Observable<SearchResults> {
    const t = term.toLowerCase().trim();
    if (!t) return of({ people: [], posts: [] });

    return combineLatest([this.getUsers$(), this.getRecentPosts$()]).pipe(
      map(([users, posts]) => {
        const people = users
          .filter(
            (u) =>
              u.displayName?.toLowerCase().includes(t) ||
              u.role?.toLowerCase().includes(t) ||
              u.languages?.some((l) => l.toLowerCase().includes(t)),
          )
          .slice(0, 5);

        const matchedPosts = posts
          .filter(
            (p) =>
              p.text?.toLowerCase().includes(t) ||
              p.authorDisplayName?.toLowerCase().includes(t) ||
              p.authorName?.toLowerCase().includes(t),
          )
          .slice(0, 5);

        return { people, posts: matchedPosts };
      }),
    );
  }

  private getUsers$(): Observable<PublicUser[]> {
    const usersCol = collection(this.firestore, 'users');
    return collectionData(usersCol, { idField: 'uid' }) as Observable<PublicUser[]>;
  }

  private getRecentPosts$(): Observable<Post[]> {
    const postsRef = collection(this.firestore, 'posts');
    const q = query(postsRef, orderBy('createdAt', 'desc'), limit(200));
    return collectionData(q, { idField: 'id' }).pipe(
      map((posts: any[]) =>
        posts.map((p) => ({
          ...p,
          createdAt: p.createdAt?.toDate ? p.createdAt.toDate() : p.createdAt,
        })),
      ),
    ) as Observable<Post[]>;
  }
}
