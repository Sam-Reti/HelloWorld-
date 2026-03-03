import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { PostService } from '../../services/postservice';
import { PracticeSession } from '../practice.models';

@Component({
  selector: 'app-session-detail-modal',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './session-detail-modal.html',
  styleUrl: './session-detail-modal.css',
})
export class SessionDetailModalComponent {
  @Input({ required: true }) session!: PracticeSession;
  @Output() close = new EventEmitter<void>();

  private postService = inject(PostService);

  sharing = signal(false);
  shared = signal(false);

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

  async shareToFeed() {
    this.sharing.set(true);
    try {
      await this.postService.createPracticePost({
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
      });
      this.shared.set(true);
    } finally {
      this.sharing.set(false);
    }
  }
}
