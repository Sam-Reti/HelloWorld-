import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { AppHome } from './app-home';
import { provideFirebaseMocks, FAKE_USER, createMockRouter, createMockActivatedRoute } from '../../testing/firebase-mocks';
import { Router, ActivatedRoute } from '@angular/router';
import { User } from '../services/user';
import { SearchService } from '../services/search.service';
import { ScrollService } from '../services/scroll.service';
import { ThemeService } from '../services/theme.service';
import { ChatPopupService } from '../services/chat-popup.service';
import { ChatService } from '../services/chat.service';
import { PresenceService } from '../services/presence.service';
import { VideoCallService } from '../video-call/video-call.service';
import { of } from 'rxjs';

import { Auth, authState } from '@angular/fire/auth';
import { Firestore, collectionData, docData, getDoc } from '@angular/fire/firestore';
import { signOut } from 'firebase/auth';

describe('AppHome', () => {
  let component: AppHome;
  let fixture: ComponentFixture<AppHome>;
  let mockRouter: ReturnType<typeof createMockRouter>;

  beforeEach(async () => {
    vi.resetAllMocks();
    (authState as any).mockReturnValue(of(FAKE_USER));
    (collectionData as any).mockReturnValue(of([]));
    (docData as any).mockReturnValue(of(undefined));
    (getDoc as any).mockResolvedValue({ exists: () => false, data: () => null });
    mockRouter = createMockRouter();
    (signOut as any).mockResolvedValue(undefined);

    await TestBed.configureTestingModule({
      imports: [AppHome],
      providers: [
        ...provideFirebaseMocks({ Auth, Firestore }),
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: createMockActivatedRoute() },
        { provide: User, useValue: { ensureUserProfile: vi.fn().mockResolvedValue(undefined) } },
        { provide: SearchService, useValue: { search: vi.fn().mockReturnValue(of({ people: [], posts: [] })) } },
        { provide: ScrollService, useValue: { scrollToPost: vi.fn() } },
        { provide: ThemeService, useValue: { init: vi.fn(), apply: vi.fn(), current: vi.fn().mockReturnValue('clean') } },
        { provide: ChatPopupService, useValue: { openChat: vi.fn().mockReturnValue(null) } },
        { provide: ChatService, useValue: { getConversations$: vi.fn().mockReturnValue(of([])) } },
        { provide: PresenceService, useValue: { onlineUsers$: of(new Set()) } },
        { provide: VideoCallService, useValue: {
          listenForIncomingCalls: vi.fn(),
          stopListening: vi.fn(),
          activeCall: vi.fn().mockReturnValue(null),
          incomingCall: vi.fn().mockReturnValue(null),
        } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(AppHome, {
        set: { template: '<div></div>' },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AppHome);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('logout()', () => {
    it('should sign out and navigate to /login', async () => {
      await component.logout();
      expect(signOut).toHaveBeenCalled();
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/login');
    });
  });

  describe('toggleNotifications()', () => {
    it('should toggle notifOpen', () => {
      expect(component.notifOpen).toBe(false);
      component.toggleNotifications();
      expect(component.notifOpen).toBe(true);
      component.toggleNotifications();
      expect(component.notifOpen).toBe(false);
    });
  });

  describe('toggleMenu()', () => {
    it('should toggle menuOpen', () => {
      expect(component.menuOpen).toBe(false);
      component.toggleMenu();
      expect(component.menuOpen).toBe(true);
    });
  });

  describe('getInitials()', () => {
    it('should return "U" for null', () => {
      expect(component.getInitials(null)).toBe('U');
    });

    it('should return first 2 chars for single word', () => {
      expect(component.getInitials('Alice')).toBe('AL');
    });

    it('should return initials for two words', () => {
      expect(component.getInitials('John Doe')).toBe('JD');
    });
  });

  describe('search', () => {
    it('onSearchInput should set searchOpen for non-empty term', () => {
      component.searchTerm = 'test';
      component.onSearchInput();
      expect(component.searchOpen).toBe(true);
    });

    it('clearSearch should reset searchTerm and close', () => {
      component.searchTerm = 'test';
      component.searchOpen = true;
      component.clearSearch();
      expect(component.searchTerm).toBe('');
      expect(component.searchOpen).toBe(false);
    });
  });
});
