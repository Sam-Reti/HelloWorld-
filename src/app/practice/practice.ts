import { Component, inject, signal } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { PracticeService } from '../services/practice.service';
import { PostService } from '../services/postservice';
import { CodeEditorComponent } from './code-editor/code-editor';
import {
  PracticeLanguage,
  PracticeCategory,
  PracticeLevel,
  PracticeState,
  ChallengePayload,
  GradePayload,
} from './practice.models';

const LANGUAGES: PracticeLanguage[] = [
  'JavaScript',
  'TypeScript',
  'Python',
  'Java',
  'Go',
  'Rust',
  'C#',
  'C++',
];

const CATEGORIES: PracticeCategory[] = [
  'Logic Bugs',
  'Security Vulnerabilities',
  'Performance Issues',
  'Code Style',
  'Algorithm Errors',
  'Edge Case Handling',
];

const LEVELS: PracticeLevel[] = ['Easy', 'Medium', 'Hard'];

@Component({
  selector: 'app-practice',
  standalone: true,
  imports: [CodeEditorComponent],
  templateUrl: './practice.html',
  styleUrl: './practice.css',
})
export class PracticeComponent {
  private practiceService = inject(PracticeService);
  private postService = inject(PostService);
  private auth = inject(Auth);

  readonly languages = LANGUAGES;
  readonly categories = CATEGORIES;
  readonly levels = LEVELS;

  state = signal<PracticeState>('selecting');
  errorMessage = signal('');
  selectedLanguage = signal<PracticeLanguage>('Python');
  selectedCategory = signal<PracticeCategory>('Logic Bugs');
  selectedLevel = signal<PracticeLevel>('Medium');
  challenge = signal<ChallengePayload | null>(null);
  submission = signal('');
  gradeResult = signal<GradePayload | null>(null);

  feedbackTab = signal<'feedback' | 'question'>('feedback');
  sharing = signal(false);
  shared = signal(false);

  async generateChallenge() {
    this.errorMessage.set('');
    this.state.set('loading');
    try {
      const payload = await this.practiceService.generateChallenge(
        this.selectedLanguage(),
        this.selectedCategory(),
        this.selectedLevel(),
      );
      this.challenge.set(payload);
      this.submission.set(payload.code);
      this.state.set('coding');
    } catch (err: any) {
      this.errorMessage.set(err?.message ?? 'Failed to generate challenge. Please try again.');
      this.state.set('selecting');
    }
  }

  onCodeChange(code: string) {
    this.submission.set(code);
  }

  async submitSolution() {
    const ch = this.challenge();
    if (!ch) return;

    this.errorMessage.set('');
    this.state.set('grading');
    try {
      const grade = await this.practiceService.gradeSubmission(
        this.selectedLanguage(),
        this.selectedCategory(),
        ch.code,
        this.submission(),
      );
      this.gradeResult.set(grade);

      const user = this.auth.currentUser;
      if (user) {
        await this.practiceService.saveSession({
          uid: user.uid,
          language: this.selectedLanguage(),
          category: this.selectedCategory(),
          level: this.selectedLevel(),
          challenge: ch.code,
          challengeDescription: ch.description,
          submission: this.submission(),
          score: grade.score,
          grade: grade.grade,
          feedback: grade.feedback,
          correctedCode: grade.correctedCode,
        });
      }

      this.state.set('result');
    } catch (err: any) {
      this.errorMessage.set(err?.message ?? 'Failed to grade submission. Please try again.');
      this.state.set('coding');
    }
  }

  cancelCoding() {
    this.challenge.set(null);
    this.submission.set('');
    this.errorMessage.set('');
    this.state.set('selecting');
  }

  async shareToFeed() {
    const gr = this.gradeResult();
    const ch = this.challenge();
    if (!gr || !ch) return;

    this.sharing.set(true);
    try {
      await this.postService.createPracticePost({
        language: this.selectedLanguage(),
        category: this.selectedCategory(),
        level: this.selectedLevel(),
        score: gr.score,
        grade: gr.grade,
        feedback: gr.feedback,
        challenge: ch.code,
        description: ch.description,
        submission: this.submission(),
        correctedCode: gr.correctedCode,
      });
      this.shared.set(true);
    } catch (err: any) {
      this.errorMessage.set(err?.message ?? 'Failed to share. Please try again.');
    } finally {
      this.sharing.set(false);
    }
  }

  reset() {
    this.challenge.set(null);
    this.submission.set('');
    this.gradeResult.set(null);
    this.errorMessage.set('');
    this.feedbackTab.set('feedback');
    this.sharing.set(false);
    this.shared.set(false);
    this.state.set('selecting');
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
}
