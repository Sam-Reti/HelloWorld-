import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PracticeResultModalComponent } from './practice-result-modal';

describe('PracticeResultModalComponent', () => {
  let component: PracticeResultModalComponent;
  let fixture: ComponentFixture<PracticeResultModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PracticeResultModalComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(PracticeResultModalComponent);
    component = fixture.componentInstance;
    component.post = {
      text: '', authorId: 'u1', authorName: 'Test', createdAt: new Date(),
      likeCount: 0, commentCount: 0, type: 'practice',
      practiceGrade: 'B', practiceScore: 85, practiceLanguage: 'Python',
      practiceFeedback: 'Good work', practiceChallenge: 'code',
      practiceDescription: 'Fix bug', practiceSubmission: 'fixed code',
      practiceCorrectedCode: 'correct code',
    } as any;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('close', () => {
    it('should emit close event on backdrop click', () => {
      const spy = vi.fn();
      component.close.subscribe(spy);
      component.onBackdropClick({ target: { classList: { contains: (c: string) => c === 'modal-overlay' } } } as any);
      expect(spy).toHaveBeenCalled();
    });
  });
});
