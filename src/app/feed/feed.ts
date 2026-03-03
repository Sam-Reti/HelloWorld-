import {
  Component,
  OnInit,
  AfterViewInit,
  ChangeDetectorRef,
  DestroyRef,
  ElementRef,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { PostService } from '../services/postservice';
import { AsyncPipe, DatePipe } from '@angular/common';
import { CommonModule } from '@angular/common';
import { MarkdownPipe } from '../pipes/markdown.pipe';
import { Auth } from '@angular/fire/auth';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ScrollService } from '../services/scroll.service';
import { FollowService } from '../services/follow.service';
import { map } from 'rxjs';
import { Post } from '../services/postservice';
import { PracticePostCardComponent } from '../practice/practice-post-card/practice-post-card';
import { QueryDocumentSnapshot, DocumentData, getDoc, doc } from 'firebase/firestore';
import { Firestore } from '@angular/fire/firestore';

const PAGE_SIZE = 30;

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
    AsyncPipe,
    CommonModule,
    RouterLink,
    MarkdownPipe,
    PracticePostCardComponent,
  ],
  templateUrl: './feed.html',
  styleUrl: './feed.css',
})
export class Feed implements OnInit, AfterViewInit {
  @ViewChild('scrollSentinel') private scrollSentinel!: ElementRef<HTMLElement>;
  @ViewChild('imageInput') private imageInput!: ElementRef<HTMLInputElement>;

  private destroyRef = inject(DestroyRef);
  private observer?: IntersectionObserver;

  text = '';
  posts = signal<Post[]>([]);
  loading = signal(false);
  hasMore = signal(true);
  selectedImage = signal<File | null>(null);
  imagePreview = signal<string | null>(null);

  currentUid: string | null = null;
  isAdmin = signal(false);
  commentText: Record<string, string> = {};
  showComments: Record<string, boolean> = {};
  likedPostIds = new Set<string>();
  private likeChecked = new Set<string>();
  private currentUids: string[] = [];
  private cursors: (QueryDocumentSnapshot<DocumentData> | null)[] = [];

  userColors: Record<string, string> = {};

  constructor(
    private postService: PostService,
    private auth: Auth,
    private route: ActivatedRoute,
    private scrollService: ScrollService,
    private followService: FollowService,
    private cdr: ChangeDetectorRef,
    private firestore: Firestore,
  ) {
    this.currentUid = this.auth.currentUser?.uid ?? null;
    this.destroyRef.onDestroy(() => this.observer?.disconnect());
    this.loadAdminStatus();
  }

  private async loadAdminStatus() {
    const uid = this.auth.currentUser?.uid;
    if (!uid) return;
    const snap = await getDoc(doc(this.firestore, `users/${uid}`));
    if (snap.exists() && snap.data()?.['isAdmin'] === true) {
      this.isAdmin.set(true);
    }
  }

  ngOnInit() {
    this.followService
      .getAllUsers$()
      .pipe(
        map((users) => {
          const colors: Record<string, string> = {};
          for (const u of users) if (u.avatarColor) colors[u.uid] = u.avatarColor;
          return colors;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((c) => {
        this.userColors = c;
        this.cdr.markForCheck();
      });

    this.followService
      .getFollowingIds$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(async (ids) => {
        this.currentUids = this.currentUid ? [...ids, this.currentUid] : [...ids];
        this.resetAndLoad();
      });

    this.scrollService.scrollToPost$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((postId) => {
        if (postId) setTimeout(() => this.scrollToPost(postId), 100);
      });
  }

  ngAfterViewInit() {
    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !this.loading() && this.hasMore()) {
          this.loadPage();
        }
      },
      { threshold: 0.1 },
    );
    this.observer.observe(this.scrollSentinel.nativeElement);
  }

  private resetAndLoad() {
    this.cursors = [];
    this.posts.set([]);
    this.hasMore.set(true);
    this.likeChecked.clear();
    this.loadPage();
  }

  private async loadPage() {
    if (this.loading() || !this.currentUids.length) return;
    this.loading.set(true);
    try {
      const result = await this.postService.getPostsPage(
        this.currentUids,
        PAGE_SIZE,
        this.cursors,
      );
      this.posts.update((prev) => [...prev, ...result.posts]);
      this.cursors = result.cursors;
      this.hasMore.set(result.hasMore);
      this.checkLikes(result.posts);
    } finally {
      this.loading.set(false);
    }
  }

  private checkLikes(posts: Post[]) {
    for (const post of posts) {
      if (post.id && !this.likeChecked.has(post.id)) {
        this.likeChecked.add(post.id);
        this.postService.hasLiked(post.id).then((liked) => {
          if (liked) this.likedPostIds = new Set([...this.likedPostIds, post.id!]);
          this.cdr.markForCheck();
        });
      }
    }
  }

  isLiked(postId: string): boolean {
    return this.likedPostIds.has(postId);
  }

  async createPost() {
    try {
      await this.postService.createPost(this.text, this.selectedImage());
      this.text = '';
      this.clearImage();
      this.resetAndLoad();
    } catch (e) {
      console.error('Post creation failed:', e);
    }
  }

  onImageSelect(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    if (!file) return;
    const prev = this.imagePreview();
    if (prev) URL.revokeObjectURL(prev);
    this.selectedImage.set(file);
    this.imagePreview.set(URL.createObjectURL(file));
  }

  removeImage() {
    this.clearImage();
  }

  private clearImage() {
    const prev = this.imagePreview();
    if (prev) URL.revokeObjectURL(prev);
    this.selectedImage.set(null);
    this.imagePreview.set(null);
    if (this.imageInput?.nativeElement) this.imageInput.nativeElement.value = '';
  }

  async delete(postId: string) {
    await this.postService.deletePost(postId);
    this.posts.update((prev) => prev.filter((p) => p.id !== postId));
  }

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
      this.posts.update((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, text: trimmed } : p)),
      );
      this.editingPostId = null;
      this.editText = '';
    } catch (e) {
      console.error('Edit failed:', e);
    }
  }

  async toggleLike(id: string) {
    const wasLiked = this.likedPostIds.has(id);
    const next = new Set(this.likedPostIds);
    wasLiked ? next.delete(id) : next.add(id);
    this.likedPostIds = next;

    try {
      await this.postService.toggleLike(id);
    } catch {
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
    this.commentText[postId] = '';
    try {
      await this.postService.addComment(postId, text);
    } catch (e) {
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
    if (!element) return;

    const scrollContainer = element.closest('.center-scroll') || window;
    const elementTop = element.getBoundingClientRect().top;
    const containerTop =
      scrollContainer instanceof Window
        ? 0
        : (scrollContainer as HTMLElement).getBoundingClientRect().top;
    const scrollOffset = elementTop - containerTop - 250;

    if (scrollContainer instanceof Window) {
      window.scrollBy({ top: scrollOffset, behavior: 'smooth' });
    } else {
      (scrollContainer as HTMLElement).scrollBy({ top: scrollOffset, behavior: 'smooth' });
    }

    element.classList.add('highlight');
    setTimeout(() => element.classList.remove('highlight'), 2000);
  }
}
