import { Component, Input, signal } from '@angular/core';
import { Post } from '../../services/postservice';
import { PracticeResultModalComponent } from '../practice-result-modal/practice-result-modal';
import { MarkdownPipe } from '../../pipes/markdown.pipe';

@Component({
  selector: 'app-practice-post-card',
  standalone: true,
  imports: [PracticeResultModalComponent, MarkdownPipe],
  templateUrl: './practice-post-card.html',
  styleUrl: './practice-post-card.css',
})
export class PracticePostCardComponent {
  @Input({ required: true }) post!: Post;

  showModal = signal(false);

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
