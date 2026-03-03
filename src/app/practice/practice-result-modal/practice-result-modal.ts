import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Post } from '../../services/postservice';

@Component({
  selector: 'app-practice-result-modal',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './practice-result-modal.html',
  styleUrl: './practice-result-modal.css',
})
export class PracticeResultModalComponent {
  @Input({ required: true }) post!: Post;
  @Output() close = new EventEmitter<void>();

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close.emit();
    }
  }

  gradeColor(grade: string | undefined): string {
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
}
