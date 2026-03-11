import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PracticeComponent } from './practice';
import { provideFirebaseMocks, FAKE_USER, createMockRouter } from '../../testing/firebase-mocks';
import { PracticeService } from '../services/practice.service';
import { PostService } from '../services/postservice';
import { ScrollService } from '../services/scroll.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { Auth, authState } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';

describe('PracticeComponent', () => {
  let component: PracticeComponent;
  let fixture: ComponentFixture<PracticeComponent>;
  let mockPracticeService: any;
  let mockPostService: any;
  let mockRouter: ReturnType<typeof createMockRouter>;

  beforeEach(async () => {
    vi.resetAllMocks();
    (authState as any).mockReturnValue(of(FAKE_USER));
    mockRouter = createMockRouter();

    mockPracticeService = {
      generateChallenge: vi.fn().mockResolvedValue({ code: 'let x = 1;', description: 'Fix the bug' }),
      generateBuildChallenge: vi.fn().mockResolvedValue({ code: '', description: 'Build this' }),
      gradeSubmission: vi.fn().mockResolvedValue({ score: 85, grade: 'B', feedback: 'Good', correctedCode: 'fixed' }),
      gradeBuildSubmission: vi.fn().mockResolvedValue({ score: 90, grade: 'A', feedback: 'Great', correctedCode: 'code' }),
      saveSession: vi.fn().mockResolvedValue(undefined),
    };
    mockPostService = {
      createPracticePost: vi.fn().mockResolvedValue('post-1'),
      createCodePost: vi.fn().mockResolvedValue('post-2'),
    };

    await TestBed.configureTestingModule({
      imports: [PracticeComponent],
      providers: [
        ...provideFirebaseMocks({ Auth, Firestore }),
        { provide: PracticeService, useValue: mockPracticeService },
        { provide: PostService, useValue: mockPostService },
        { provide: ScrollService, useValue: { scrollToPost: vi.fn() } },
        { provide: Router, useValue: mockRouter },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PracticeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start in selecting state', () => {
    expect(component.state()).toBe('selecting');
  });

  describe('gradeColor()', () => {
    it('should return green for A', () => {
      expect(component.gradeColor('A')).toBe('var(--grade-a, #22c55e)');
    });

    it('should return lime for B', () => {
      expect(component.gradeColor('B')).toBe('var(--grade-b, #84cc16)');
    });

    it('should return yellow for C', () => {
      expect(component.gradeColor('C')).toBe('var(--grade-c, #eab308)');
    });

    it('should return orange for D', () => {
      expect(component.gradeColor('D')).toBe('var(--grade-d, #f97316)');
    });

    it('should return red for F', () => {
      expect(component.gradeColor('F')).toBe('var(--grade-f, #ef4444)');
    });
  });

  describe('generateChallenge()', () => {
    it('should transition to loading then coding state', async () => {
      await component.generateChallenge();
      expect(component.state()).toBe('coding');
      expect(component.challenge()).toEqual({ code: 'let x = 1;', description: 'Fix the bug' });
    });

    it('should set error on failure', async () => {
      mockPracticeService.generateChallenge.mockRejectedValue(new Error('AI failed'));
      await component.generateChallenge();
      expect(component.state()).toBe('selecting');
      expect(component.errorMessage()).toContain('AI failed');
    });
  });

  describe('reset()', () => {
    it('should reset to selecting state', () => {
      component.state.set('result');
      component.reset();
      expect(component.state()).toBe('selecting');
    });
  });

  describe('cancelCoding()', () => {
    it('should return to selecting state', () => {
      component.state.set('coding');
      component.cancelCoding();
      expect(component.state()).toBe('selecting');
    });
  });
});
