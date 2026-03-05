import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MarkdownPipe } from '../../pipes/markdown.pipe';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PostService } from '../../services/postservice';
import { ScrollService } from '../../services/scroll.service';
import { PracticeSession } from '../practice.models';

@Component({
  selector: 'app-session-detail-modal',
  standalone: true,
  imports: [DatePipe, FormsModule, MarkdownPipe],
  templateUrl: './session-detail-modal.html',
  styleUrl: './session-detail-modal.css',
})
export class SessionDetailModalComponent {
  @Input({ required: true }) session!: PracticeSession;
  @Output() close = new EventEmitter<void>();

  private postService = inject(PostService);
  private router = inject(Router);
  private scrollService = inject(ScrollService);

  sharing = signal(false);
  shared = signal(false);
  showCompose = signal(false);
  captionText = signal('');

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close.emit();
    }
  }

  gradeColor(grade: string): string {
    switch (grade) {
      case 'A':
        return 'var(--grade-a, #22c55e)';
      case 'B':
        return 'var(--grade-b, #84cc16)';
      case 'C':
        return 'var(--grade-c, #eab308)';
      case 'D':
        return 'var(--grade-d, #f97316)';
      default:
        return 'var(--grade-f, #ef4444)';
    }
  }

  openCompose() {
    this.captionText.set('');
    this.showCompose.set(true);
  }

  cancelCompose() {
    this.showCompose.set(false);
    this.captionText.set('');
  }

  async shareToFeed() {
    this.sharing.set(true);
    this.showCompose.set(false);
    try {
      const postId = await this.postService.createPracticePost(
        {
          language: this.session.language,
          category: this.session.category,
          level: this.session.level,
          score: this.session.score,
          grade: this.session.grade,
          feedback: this.session.feedback,
          challenge: this.session.challenge,
          description: this.session.challengeDescription,
          submission: this.session.submission,
          correctedCode: this.session.correctedCode ?? '',
        },
        this.captionText().trim(),
      );
      this.close.emit();
      await this.router.navigateByUrl('/app-home/feed');
      setTimeout(() => {
        this.scrollService.refresh();
        this.scrollService.scrollToPost(postId);
      }, 300);
    } catch {
      this.sharing.set(false);
      this.showCompose.set(true);
    }
  }
}
