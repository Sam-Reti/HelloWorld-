import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SessionDetailModalComponent } from './session-detail-modal';
import { provideFirebaseMocks, FAKE_USER } from '../../../testing/firebase-mocks';
import { PostService } from '../../services/postservice';
import { ScrollService } from '../../services/scroll.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { Auth, authState } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';

describe('SessionDetailModalComponent', () => {
  let component: SessionDetailModalComponent;
  let fixture: ComponentFixture<SessionDetailModalComponent>;

  beforeEach(async () => {
    vi.resetAllMocks();
    (authState as any).mockReturnValue(of(FAKE_USER));

    await TestBed.configureTestingModule({
      imports: [SessionDetailModalComponent],
      providers: [
        ...provideFirebaseMocks({ Auth, Firestore }),
        { provide: PostService, useValue: { createPracticePost: vi.fn().mockResolvedValue('post-1') } },
        { provide: ScrollService, useValue: { scrollToPost: vi.fn() } },
        { provide: Router, useValue: { navigateByUrl: vi.fn().mockResolvedValue(true) } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SessionDetailModalComponent);
    component = fixture.componentInstance;
    component.session = {
      uid: FAKE_USER.uid, mode: 'fix', language: 'JavaScript', category: 'Logic Bugs',
      level: 'Easy', challenge: 'code', challengeDescription: 'desc', submission: 'sub',
      score: 90, grade: 'A', feedback: 'Great', correctedCode: 'fixed', createdAt: new Date(),
    };
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('close', () => {
    it('should emit closed event on backdrop click', () => {
      const spy = vi.fn();
      component.close.subscribe(spy);
      component.onBackdropClick({ target: { classList: { contains: (c: string) => c === 'modal-overlay' } } } as any);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('gradeColor()', () => {
    it('should return green for A', () => {
      expect(component.gradeColor('A')).toBe('var(--grade-a, #22c55e)');
    });
  });
});
