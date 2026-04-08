import { TestBed } from '@angular/core/testing';
import { CircleDetailComponent } from './circle-detail';
import { provideFirebaseMocks, FAKE_USER, createMockRouter } from '../../../testing/firebase-mocks';
import { of } from 'rxjs';

import { Auth, authState } from '@angular/fire/auth';
import { Firestore, collectionData, docData } from '@angular/fire/firestore';
import { Storage } from '@angular/fire/storage';
import { FirebaseApp } from '@angular/fire/app';
import { getDocs } from 'firebase/firestore';
import { Router, ActivatedRoute } from '@angular/router';
import { HiyveService, RoomService } from '@hiyve/angular';

describe('CircleDetailComponent', () => {
  let component: CircleDetailComponent;

  beforeEach(() => {
    vi.resetAllMocks();
    (authState as any).mockReturnValue(of(FAKE_USER));
    (collectionData as any).mockReturnValue(of([]));
    (docData as any).mockReturnValue(of(undefined));
    // getDocs is called by CircleSessionService.cleanupStaleSessions in constructor
    (getDocs as any).mockResolvedValue({ empty: true, docs: [] });

    const g = globalThis as any;

    TestBed.configureTestingModule({
      imports: [CircleDetailComponent],
      providers: [
        ...provideFirebaseMocks({ Auth, Firestore, Storage, FirebaseApp }),
        { provide: Router, useValue: createMockRouter() },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of({ get: (key: string) => (key === 'circleId' ? 'test-circle' : null) }),
            snapshot: { params: { circleId: 'test-circle' } },
          },
        },
        { provide: HiyveService, useValue: { createRoom: vi.fn() } },
        { provide: RoomService, useValue: { isInRoom$: of(false) } },
        ...(g.__MockHiyveService !== HiyveService
          ? [{ provide: g.__MockHiyveService, useValue: { createRoom: vi.fn() } }]
          : []),
        ...(g.__MockRoomService !== RoomService
          ? [{ provide: g.__MockRoomService, useValue: { isInRoom$: of(false) } }]
          : []),
      ],
    });
    const fixture = TestBed.createComponent(CircleDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('getInitials()', () => {
    it('should return C for empty string', () => {
      expect(component.getInitials('')).toBe('C');
    });

    it('should return two chars for single word', () => {
      expect(component.getInitials('Tech')).toBe('TE');
    });

    it('should return initials for two words', () => {
      expect(component.getInitials('Dev World')).toBe('DW');
    });
  });

  describe('startEditCircle / cancelEditCircle', () => {
    it('should populate edit fields from circle', () => {
      const circle = {
        id: 'c1',
        name: 'My Circle',
        description: 'A circle',
        bannerUrl: 'https://example.com/banner.png',
      } as any;
      component.startEditCircle(circle);

      expect(component.editing()).toBe(true);
      expect(component.editName).toBe('My Circle');
      expect(component.editDescription).toBe('A circle');
      expect(component.editBannerPreview()).toBe('https://example.com/banner.png');
    });

    it('should reset edit fields on cancel', () => {
      component.startEditCircle({ name: 'X', description: 'Y', bannerUrl: null } as any);
      component.cancelEditCircle();

      expect(component.editing()).toBe(false);
      expect(component.editName).toBe('');
      expect(component.editDescription).toBe('');
      expect(component.editBannerPreview()).toBeNull();
    });
  });

  describe('activeTab', () => {
    it('should default based on membership', () => {
      expect(component.activeTab()).toBeDefined();
    });
  });
});
