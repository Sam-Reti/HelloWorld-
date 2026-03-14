import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { PracticeService } from '../services/practice.service';
import { PostService } from '../services/postservice';
import { ScrollService } from '../services/scroll.service';
import { CodeEditorComponent } from './code-editor/code-editor';
import { MarkdownPipe } from '../pipes/markdown.pipe';
import {
  PracticeLanguage,
  PracticeCategory,
  PracticeLevel,
  PracticeMode,
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
  imports: [CodeEditorComponent, FormsModule, MarkdownPipe],
  templateUrl: './practice.html',
  styleUrl: './practice.css',
})
export class PracticeComponent {
  private practiceService = inject(PracticeService);
  private postService = inject(PostService);
  private auth = inject(Auth);
  private router = inject(Router);
  private scrollService = inject(ScrollService);

  readonly languages = LANGUAGES;
  readonly categories = CATEGORIES;
  readonly levels = LEVELS;

  state = signal<PracticeState>('selecting');
  errorMessage = signal('');
  selectedMode = signal<PracticeMode>('fix');
  selectedLanguage = signal<PracticeLanguage>('Python');
  selectedCategory = signal<PracticeCategory>('Logic Bugs');
  selectedLevel = signal<PracticeLevel>('Medium');
  challenge = signal<ChallengePayload | null>(null);
  submission = signal('');
  gradeResult = signal<GradePayload | null>(null);

  feedbackTab = signal<'feedback' | 'question'>('feedback');
  sharing = signal(false);
  shared = signal(false);

  customPrompt = signal('');

  scratchCode = signal('');
  sharingScratch = signal(false);
  showCompose = signal<'practice' | 'scratch' | null>(null);
  captionText = signal('');

  async generateChallenge() {
    this.errorMessage.set('');
    const mode = this.selectedMode();

    if (mode === 'prompt' && !this.customPrompt().trim()) {
      this.errorMessage.set('Please describe the challenge you want.');
      return;
    }

    this.state.set('loading');
    try {
      let payload: ChallengePayload;
      if (mode === 'prompt') {
        payload = await this.practiceService.generatePromptChallenge(
          this.selectedLanguage(),
          this.customPrompt(),
        );
      } else if (mode === 'build') {
        payload = await this.practiceService.generateBuildChallenge(
          this.selectedLanguage(),
          this.selectedCategory(),
          this.selectedLevel(),
        );
      } else {
        payload = await this.practiceService.generateChallenge(
          this.selectedLanguage(),
          this.selectedCategory(),
          this.selectedLevel(),
        );
      }
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
      const mode = this.selectedMode();
      const grade = mode === 'build' || mode === 'prompt'
        ? await this.practiceService.gradeBuildSubmission(
            this.selectedLanguage(),
            mode === 'prompt' ? undefined : this.selectedCategory(),
            ch.description,
            this.submission(),
          )
        : await this.practiceService.gradeSubmission(
            this.selectedLanguage(),
            this.selectedCategory(),
            ch.code,
            this.submission(),
          );
      this.gradeResult.set(grade);

      const user = this.auth.currentUser;
      if (user) {
        const isPrompt = this.selectedMode() === 'prompt';
        await this.practiceService.saveSession({
          uid: user.uid,
          mode: this.selectedMode(),
          language: this.selectedLanguage(),
          ...(isPrompt ? {} : { category: this.selectedCategory(), level: this.selectedLevel() }),
          ...(isPrompt ? { customPrompt: this.customPrompt() } : {}),
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

  openCompose(type: 'practice' | 'scratch') {
    this.captionText.set('');
    this.showCompose.set(type);
  }

  cancelCompose() {
    this.showCompose.set(null);
    this.captionText.set('');
  }

  async shareToFeed() {
    const gr = this.gradeResult();
    const ch = this.challenge();
    if (!gr || !ch) return;

    this.sharing.set(true);
    this.showCompose.set(null);
    try {
      const postId = await this.postService.createPracticePost(
        {
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
        },
        this.captionText().trim(),
      );
      await this.router.navigateByUrl('/app-home/feed');
      setTimeout(() => {
        this.scrollService.refresh();
        this.scrollService.scrollToPost(postId);
      }, 300);
    } catch (err: any) {
      this.errorMessage.set(err?.message ?? 'Failed to share. Please try again.');
      this.sharing.set(false);
    }
  }

  async shareScratchPad() {
    const code = this.scratchCode().trim();
    if (!code) return;

    this.sharingScratch.set(true);
    this.showCompose.set(null);
    try {
      const postId = await this.postService.createCodePost(
        code,
        this.selectedLanguage(),
        this.captionText().trim(),
      );
      await this.router.navigateByUrl('/app-home/feed');
      setTimeout(() => {
        this.scrollService.refresh();
        this.scrollService.scrollToPost(postId);
      }, 300);
    } catch (err: any) {
      this.errorMessage.set(err?.message ?? 'Failed to share. Please try again.');
      this.sharingScratch.set(false);
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
    this.customPrompt.set('');
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
