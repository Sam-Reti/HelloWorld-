import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PostService } from '../services/postservice'; // make sure path/name matches your file
import { AsyncPipe, DatePipe } from '@angular/common';
import { CommonModule } from '@angular/common';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [FormsModule, DatePipe, AsyncPipe, CommonModule],
  templateUrl: './feed.html',
  styleUrl: './feed.css',
})
export class Feed implements OnInit {
  renderMarkdown(text: string): string {
    const html = marked.parse(text ?? '') as string;
    return DOMPurify.sanitize(html);
  }
  text = '';
  posts$!: ReturnType<PostService['getPosts']>;
  currentUid: string | null = null;
  commentText: Record<string, string> = {};
  showComments: Record<string, boolean> = {};

  constructor(
    private postService: PostService,
    private auth: Auth,
  ) {
    this.currentUid = this.auth.currentUser?.uid ?? null;
  }

  ngOnInit() {
    this.posts$ = this.postService.getPosts();
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
    const text = this.commentText[postId] ?? '';
    await this.postService.addComment(postId, text);
    this.commentText[postId] = '';
  }
  comments$: Record<string, any> = {};

  getComments(postId: string) {
    if (!this.comments$[postId]) {
      this.comments$[postId] = this.postService.getComments(postId);
    }
    return this.comments$[postId];
  }
}
