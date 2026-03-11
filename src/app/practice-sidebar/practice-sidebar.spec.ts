import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PracticeSidebar } from './practice-sidebar';
import { provideFirebaseMocks, FAKE_USER, createMockActivatedRoute } from '../../testing/firebase-mocks';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { Auth, authState } from '@angular/fire/auth';
import { Firestore, collectionData } from '@angular/fire/firestore';

describe('PracticeSidebar', () => {
  let component: PracticeSidebar;
  let fixture: ComponentFixture<PracticeSidebar>;

  beforeEach(async () => {
    vi.resetAllMocks();
    (authState as any).mockReturnValue(of(FAKE_USER));
    (collectionData as any).mockReturnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [PracticeSidebar],
      providers: [
        ...provideFirebaseMocks({ Auth, Firestore }),
        { provide: ActivatedRoute, useValue: createMockActivatedRoute() },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(PracticeSidebar, { set: { template: '<div></div>' } })
      .compileComponents();

    fixture = TestBed.createComponent(PracticeSidebar);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('gradeColor()', () => {
    it('should return green for A', () => {
      expect(component.gradeColor('A')).toBe('#22c55e');
    });

    it('should return red for F', () => {
      expect(component.gradeColor('F')).toBe('#ef4444');
    });
  });
});
