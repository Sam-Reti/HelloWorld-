import { Component, OnInit } from '@angular/core';
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
import { switchMap, of, Observable } from 'rxjs';
import { Post } from '../services/postservice';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [FormsModule, DatePipe, AsyncPipe, CommonModule, RouterLink],
  templateUrl: './feed.html',
  styleUrl: './feed.css',
})
export class Feed implements OnInit {
  renderMarkdown(text: string): string {
    const html = marked.parse(text ?? '') as string;
    return DOMPurify.sanitize(html);
  }
  text = '';
  posts$!: Observable<Post[]>;
  currentUid: string | null = null;
  commentText: Record<string, string> = {};
  showComments: Record<string, boolean> = {};

  constructor(
    private postService: PostService,
    private auth: Auth,
    private route: ActivatedRoute,
    private scrollService: ScrollService,
    private followService: FollowService,
  ) {
    this.currentUid = this.auth.currentUser?.uid ?? null;
  }

  ngOnInit() {
    this.posts$ = this.followService.getFollowingIds$().pipe(
      switchMap((ids) => {
        const feedUids = this.currentUid ? [...ids, this.currentUid] : ids;
        return feedUids.length ? this.postService.getPostsFromUsers(feedUids) : of([]);
      }),
    );

    // Listen for scroll signals from notifications
    this.scrollService.scrollToPost$.subscribe((postId) => {
      if (postId) {
        // Wait a bit for the DOM to render the posts
        setTimeout(() => this.scrollToPost(postId), 100);
      }
    });
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
  async toggleLike(id: string) {
    await this.postService.toggleLike(id);
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

  getInitials(email: string | null | undefined): string {
    if (!email) return 'U';

    const namePart = email.split('@')[0]; // take everything before @
    return namePart.slice(0, 2).toUpperCase();
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
