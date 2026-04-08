import { TestBed } from '@angular/core/testing';
import { InterviewPrepComponent } from './interview-prep';
import { Component, viewChild } from '@angular/core';
import { InterviewQuestion, InterviewProgress } from './interview-prep.models';

// Wrapper to provide required signal inputs
@Component({
  standalone: true,
  imports: [InterviewPrepComponent],
  template: `<app-interview-prep [questions]="questions" [progress]="progress" (questionSelected)="selected = $event" />`,
})
class TestHost {
  questions: InterviewQuestion[] = [
    { id: 'q1', title: 'Two Sum', difficulty: 'Easy', category: 'Arrays', description: 'Find two numbers...' },
    { id: 'q2', title: 'LRU Cache', difficulty: 'Hard', category: 'Design', description: 'Design an LRU...' },
  ];
  progress = new Map<string, InterviewProgress>();
  selected: InterviewQuestion | null = null;
  component = viewChild(InterviewPrepComponent);
}

describe('InterviewPrepComponent', () => {
  let host: TestHost;
  let fixture: any;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TestHost] });
    fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    host = fixture.componentInstance;
  });

  it('should create', () => {
    expect(host.component()).toBeTruthy();
  });

  describe('difficultyColor()', () => {
    it('should return green for Easy', () => {
      expect(host.component()!.difficultyColor('Easy')).toBe('#22c55e');
    });

    it('should return yellow for Medium', () => {
      expect(host.component()!.difficultyColor('Medium')).toBe('#eab308');
    });

    it('should return red for Hard', () => {
      expect(host.component()!.difficultyColor('Hard')).toBe('#ef4444');
    });

    it('should return muted for unknown', () => {
      expect(host.component()!.difficultyColor('Unknown')).toBe('var(--text-muted)');
    });
  });

  describe('gradeColor()', () => {
    it('should return correct color for A', () => {
      expect(host.component()!.gradeColor('A')).toContain('#22c55e');
    });

    it('should return correct color for B', () => {
      expect(host.component()!.gradeColor('B')).toContain('#84cc16');
    });

    it('should return correct color for C', () => {
      expect(host.component()!.gradeColor('C')).toContain('#eab308');
    });

    it('should return correct color for D', () => {
      expect(host.component()!.gradeColor('D')).toContain('#f97316');
    });

    it('should return F color for unknown grade', () => {
      expect(host.component()!.gradeColor('F')).toContain('#ef4444');
    });
  });

  describe('progressFor()', () => {
    it('should return undefined when no progress exists', () => {
      expect(host.component()!.progressFor('q1')).toBeUndefined();
    });

    it('should return progress when it exists', () => {
      const prog: InterviewProgress = {
        questionId: 'q1',
        bestScore: 85,
        bestGrade: 'A',
        attempts: 3,
        lastAttemptAt: null,
      };
      // Recreate the fixture with progress data pre-set on the host
      const fix2 = TestBed.createComponent(TestHost);
      fix2.componentInstance.progress = new Map([['q1', prog]]);
      fix2.detectChanges();
      expect(fix2.componentInstance.component()!.progressFor('q1')).toEqual(prog);
    });
  });
});
