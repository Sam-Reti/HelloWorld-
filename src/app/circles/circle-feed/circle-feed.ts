import {
  Component,
  Input,
  ChangeDetectorRef,
  DestroyRef,
  ElementRef,
  ViewChild,
  inject,
  signal,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { AsyncPipe, DatePipe } from '@angular/common';
import { Auth } from '@angular/fire/auth';

import { CircleService } from '../../services/circle.service';
import { CirclePost } from '../circle.models';
import { FollowService, PublicUser } from '../../services/follow.service';
import { MarkdownPipe } from '../../pipes/markdown.pipe';
import { MentionPipe } from '../../pipes/mention.pipe';
import { MentionTextareaComponent } from '../../shared/mentions/mention-textarea';
import { MentionLinkDirective } from '../../shared/mentions/mention-link.directive';
import { ToastService } from '../../shared/toast/toast.service';

@Component({
  selector: 'app-circle-feed',
  standalone: true,
  imports: [
    FormsModule,
    AsyncPipe,
    DatePipe,
    MarkdownPipe,
    MentionPipe,
    MentionTextareaComponent,
    MentionLinkDirective,
  ],
  templateUrl: './circle-feed.html',
  styleUrl: './circle-feed.css',
})
export class CircleFeedComponent implements OnInit, OnChanges {
  @Input({ required: true }) circleId!: string;
  @ViewChild('imageInput') private imageInput!: ElementRef<HTMLInputElement>;

  private circleService = inject(CircleService);
  private followService = inject(FollowService);
  private auth = inject(Auth);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private toast = inject(ToastService);

  text = '';
  posts = signal<CirclePost[]>([]);
  selectedImage = signal<File | null>(null);
  imagePreview = signal<string | null>(null);

  currentUid: string | null = null;
  allUsers: PublicUser[] = [];
  userColors: Record<string, string> = {};
  postMentionedUids: string[] = [];

  commentText: Record<string, string> = {};
  commentMentionedUids: Record<string, string[]> = {};
  showComments: Record<string, boolean> = {};
  comments$: Record<string, any> = {};

  likedPostIds = new Set<string>();
  private likeChecked = new Set<string>();

  editingPostId: string | null = null;
  editText = '';

  ngOnInit() {
    this.currentUid = this.auth.currentUser?.uid ?? null;

    this.followService
      .getAllUsers$()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((users) => {
        this.allUsers = users;
        const colors: Record<string, string> = {};
        for (const u of users) if (u.avatarColor) colors[u.uid] = u.avatarColor;
        this.userColors = colors;
        this.cdr.markForCheck();
      });

    this.subscribeToPosts();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['circleId'] && !changes['circleId'].firstChange) {
      this.subscribeToPosts();
    }
  }

  private subscribeToPosts() {
    this.likeChecked.clear();
    this.circleService
      .getCirclePosts$(this.circleId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((posts) => {
        this.posts.set(posts);
        this.checkLikes(posts);
        this.cdr.markForCheck();
      });
  }

  private checkLikes(posts: CirclePost[]) {
    for (const post of posts) {
      if (!post.id || this.likeChecked.has(post.id)) continue;
      this.likeChecked.add(post.id);
      this.circleService
        .hasLikedCirclePost(this.circleId, post.id)
        .then((liked) => {
          if (liked) this.likedPostIds = new Set([...this.likedPostIds, post.id!]);
          this.cdr.markForCheck();
        })
        .catch(() => {});
    }
  }

  isLiked(postId: string): boolean {
    return this.likedPostIds.has(postId);
  }

  async createPost() {
    try {
      await this.circleService.createCirclePost(
        this.circleId,
        this.text,
        this.selectedImage(),
        this.postMentionedUids,
      );
      this.text = '';
      this.postMentionedUids = [];
      this.clearImage();
    } catch {
      this.toast.error('Failed to create post.');
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

  async deletePost(postId: string) {
    await this.circleService.deleteCirclePost(this.circleId, postId);
  }

  startEdit(post: CirclePost) {
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
      await this.circleService.updateCirclePost(this.circleId, postId, trimmed);
      this.editingPostId = null;
      this.editText = '';
    } catch {
      this.toast.error('Failed to save changes.');
    }
  }

  async toggleLike(id: string) {
    const wasLiked = this.likedPostIds.has(id);
    const delta = wasLiked ? -1 : 1;

    const next = new Set(this.likedPostIds);
    wasLiked ? next.delete(id) : next.add(id);
    this.likedPostIds = next;

    this.posts.update((prev) =>
      prev.map((p) => (p.id === id ? { ...p, likeCount: (p.likeCount || 0) + delta } : p)),
    );

    try {
      await this.circleService.toggleCirclePostLike(this.circleId, id);
    } catch {
      const revert = new Set(this.likedPostIds);
      wasLiked ? revert.add(id) : revert.delete(id);
      this.likedPostIds = revert;
      this.posts.update((prev) =>
        prev.map((p) => (p.id === id ? { ...p, likeCount: (p.likeCount || 0) - delta } : p)),
      );
    }
  }

  toggleComments(postId: string) {
    this.showComments[postId] = !this.showComments[postId];
  }

  async submitComment(postId: string) {
    const text = (this.commentText[postId] ?? '').trim();
    if (!text) return;
    const uids = this.commentMentionedUids[postId] ?? [];
    this.commentText[postId] = '';
    this.commentMentionedUids[postId] = [];
    try {
      await this.circleService.addCircleComment(this.circleId, postId, text, uids);
    } catch (e) {
      this.commentText[postId] = text;
      throw e;
    }
  }

  getComments(postId: string) {
    if (!this.comments$[postId]) {
      this.comments$[postId] = this.circleService.getCircleComments$(this.circleId, postId);
    }
    return this.comments$[postId];
  }

  getInitials(value: string | null | undefined): string {
    if (!value) return 'U';
    const parts = value.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  getAvatarColor(post: CirclePost): string {
    return this.userColors[post.authorId] || post.authorAvatarColor || '#0ea5a4';
  }

  getCommentAvatarColor(comment: any): string {
    return this.userColors[comment.authorId] || comment.authorAvatarColor || '#0ea5a4';
  }
}
