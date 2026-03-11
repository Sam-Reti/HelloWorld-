import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PracticePostCardComponent } from './practice-post-card';

describe('PracticePostCardComponent', () => {
  let component: PracticePostCardComponent;
  let fixture: ComponentFixture<PracticePostCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PracticePostCardComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PracticePostCardComponent);
    component = fixture.componentInstance;
    component.post = {
      text: '', authorId: 'u1', authorName: 'Test', createdAt: new Date(),
      likeCount: 0, commentCount: 0, type: 'practice',
      practiceGrade: 'A', practiceScore: 95, practiceLanguage: 'JavaScript',
      practiceCategory: 'Logic Bugs', practiceLevel: 'Easy',
    } as any;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('gradeColor()', () => {
    it('should return green for A', () => {
      expect(component.gradeColor('A')).toBe('var(--grade-a, #22c55e)');
    });

    it('should return red for F', () => {
      expect(component.gradeColor('F')).toBe('var(--grade-f, #ef4444)');
    });

    it('should return default for unknown grade', () => {
      expect(component.gradeColor('X')).toBe('var(--grade-f, #ef4444)');
    });
  });
});
