import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PostService } from '../services/postservice';
import { AsyncPipe, DatePipe } from '@angular/common';
import { CommonModule } from '@angular/common';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { Auth } from '@angular/fire/auth';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ScrollService } from '../services/scroll.service';
import { FollowService } from '../services/follow.service';
import { switchMap, of, Observable, map } from 'rxjs';
import { Post } from '../services/postservice';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [FormsModule, DatePipe, AsyncPipe, CommonModule, RouterLink],
  templateUrl: './feed.html',
  styleUrl: './feed.css',
})
export class Feed implements OnInit, OnDestroy {
  renderMarkdown(text: string): string {
    const html = marked.parse(text ?? '') as string;
    return DOMPurify.sanitize(html);
  }
  text = '';
  posts$!: Observable<Post[]>;
  currentUid: string | null = null;
  commentText: Record<string, string> = {};
  showComments: Record<string, boolean> = {};
  likedPostIds = new Set<string>();
  private likeChecked = new Set<string>();

  // Live map of uid → current avatarColor
  userColors: Record<string, string> = {};

  constructor(
    private postService: PostService,
    private auth: Auth,
    private route: ActivatedRoute,
    private scrollService: ScrollService,
    private followService: FollowService,
    private cdr: ChangeDetectorRef,
  ) {
    this.currentUid = this.auth.currentUser?.uid ?? null;
  }

  ngOnInit() {
    // Keep a live map of uid → avatarColor
    this.followService
      .getAllUsers$()
      .pipe(
        map((users) => {
          const colors: Record<string, string> = {};
          for (const u of users) if (u.avatarColor) colors[u.uid] = u.avatarColor;
          return colors;
        }),
      )
      .subscribe((c) => {
        this.userColors = c;
        this.cdr.markForCheck();
      });

    this.posts$ = this.followService.getFollowingIds$().pipe(
      switchMap((ids) => {
        const feedUids = this.currentUid ? [...ids, this.currentUid] : ids;
        return feedUids.length ? this.postService.getPostsFromUsers(feedUids) : of([]);
      }),
    );

    // Load liked state from Firestore for each visible post
    this.posts$.subscribe((posts) => {
      for (const post of posts) {
        if (post.id && !this.likeChecked.has(post.id)) {
          this.likeChecked.add(post.id);
          this.postService.hasLiked(post.id).then((liked) => {
            if (liked) {
              this.likedPostIds = new Set([...this.likedPostIds, post.id!]);
            }
            this.cdr.markForCheck();
          });
        }
      }
    });

    // Listen for scroll signals from notifications
    this.scrollService.scrollToPost$.subscribe((postId) => {
      if (postId) {
        // Wait a bit for the DOM to render the posts
        setTimeout(() => this.scrollToPost(postId), 100);
      }
    });
  }

  ngOnDestroy() {}

  isLiked(postId: string): boolean {
    return this.likedPostIds.has(postId);
  }

  async createPost() {
    console.log('createPost clicked');

    try {
      await this.postService.createPost(this.text);
      console.log('✅ Firestore write finished');
      this.text = '';
    } catch (e) {
      console.error('❌ Firestore write failed:', e);
    }
  }
  async delete(postId: string) {
    await this.postService.deletePost(postId);
  }

  // Edit post
  editingPostId: string | null = null;
  editText = '';

  startEdit(post: Post) {
    this.editingPostId = post.id!;
    this.editText = post.text;
  }

  cancelEdit() {
    this.editingPostId = null;
    this.editText = '';
  }

  async saveEdit(postId: string) {
    const trimmed = this.editText.trim();
    if (!trimmed) return;
    try {
      await this.postService.updatePost(postId, trimmed);
      this.editingPostId = null;
      this.editText = '';
    } catch (e) {
      console.error('Edit failed:', e);
    }
  }

  async toggleLike(id: string) {
    // Optimistically toggle
    const wasLiked = this.likedPostIds.has(id);
    const next = new Set(this.likedPostIds);
    wasLiked ? next.delete(id) : next.add(id);
    this.likedPostIds = next;

    try {
      await this.postService.toggleLike(id);
    } catch {
      // Revert on failure
      const revert = new Set(this.likedPostIds);
      wasLiked ? revert.add(id) : revert.delete(id);
      this.likedPostIds = revert;
    }
  }

  toggleComments(postId: string) {
    this.showComments[postId] = !this.showComments[postId];
  }

  async submitComment(postId: string) {
    const text = (this.commentText[postId] ?? '').trim();
    if (!text) return;

    // clear immediately for UX
    this.commentText[postId] = '';

    try {
      await this.postService.addComment(postId, text);
    } catch (e) {
      // restore on failure so user doesn't lose it
      this.commentText[postId] = text;
      throw e;
    }
  }

  comments$: Record<string, any> = {};

  getComments(postId: string) {
    if (!this.comments$[postId]) {
      this.comments$[postId] = this.postService.getComments(postId);
    }
    return this.comments$[postId];
  }

  getInitials(value: string | null | undefined): string {
    if (!value) return 'U';
    const parts = value.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  getAvatarColor(post: Post): string {
    return this.userColors[post.authorId] || post.authorAvatarColor || '#0ea5a4';
  }

  getCommentAvatarColor(comment: any): string {
    return this.userColors[comment.authorId] || comment.authorAvatarColor || '#0ea5a4';
  }

  private scrollToPost(postId: string) {
    const element = document.getElementById(`post-${postId}`);
    if (element) {
      // Find the scrollable parent container (.center-scroll)
      const scrollContainer = element.closest('.center-scroll') || window;

      // Calculate the offset position relative to the scroll container
      const elementTop = element.getBoundingClientRect().top;
      const containerTop =
        scrollContainer instanceof Window
          ? 0
          : (scrollContainer as HTMLElement).getBoundingClientRect().top;

      const scrollOffset = elementTop - containerTop - 250; // 250px offset to clear the sticky post box

      // Scroll the container
      if (scrollContainer instanceof Window) {
        window.scrollBy({ top: scrollOffset, behavior: 'smooth' });
      } else {
        (scrollContainer as HTMLElement).scrollBy({ top: scrollOffset, behavior: 'smooth' });
      }

      // Add highlight effect
      element.classList.add('highlight');
      setTimeout(() => element.classList.remove('highlight'), 2000);
    }
  }
}
