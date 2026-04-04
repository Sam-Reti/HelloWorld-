import { Component, input, output } from '@angular/core';
import { InterviewQuestion, InterviewProgress } from './interview-prep.models';

@Component({
  selector: 'app-interview-prep',
  standalone: true,
  templateUrl: './interview-prep.html',
  styleUrl: './interview-prep.css',
})
export class InterviewPrepComponent {
  questions = input.required<InterviewQuestion[]>();
  progress = input.required<Map<string, InterviewProgress>>();

  questionSelected = output<InterviewQuestion>();

  difficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'Easy':
        return '#22c55e';
      case 'Medium':
        return '#eab308';
      case 'Hard':
        return '#ef4444';
      default:
        return 'var(--text-muted)';
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

  progressFor(questionId: string): InterviewProgress | undefined {
    return this.progress().get(questionId);
  }
}
