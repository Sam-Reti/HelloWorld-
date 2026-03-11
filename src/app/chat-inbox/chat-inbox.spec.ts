import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ChatInbox } from './chat-inbox';
import { provideFirebaseMocks, FAKE_USER } from '../../testing/firebase-mocks';
import { ChatService } from '../services/chat.service';
import { ChatPopupService } from '../services/chat-popup.service';
import { FollowService } from '../services/follow.service';
import { PresenceService } from '../services/presence.service';
import { of } from 'rxjs';

import { Auth, authState } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';

describe('ChatInbox', () => {
  let component: ChatInbox;
  let fixture: ComponentFixture<ChatInbox>;
  let mockChatPopup: any;

  beforeEach(async () => {
    vi.resetAllMocks();
    (authState as any).mockReturnValue(of(FAKE_USER));

    mockChatPopup = { open: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [ChatInbox],
      providers: [
        ...provideFirebaseMocks({ Auth, Firestore }),
        {
          provide: ChatService,
          useValue: { getConversations$: vi.fn().mockReturnValue(of([])) },
        },
        { provide: ChatPopupService, useValue: mockChatPopup },
        {
          provide: FollowService,
          useValue: { getAllUsers$: vi.fn().mockReturnValue(of([])) },
        },
        { provide: PresenceService, useValue: { onlineUsers$: of(new Set(['u1'])) } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatInbox);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('otherUid()', () => {
    it('should return the other participant UID', () => {
      const result = component.otherUid([FAKE_USER.uid, 'other-uid']);
      expect(result).toBe('other-uid');
    });

    it('should return first UID if current user not found', () => {
      const result = component.otherUid(['a', 'b']);
      expect(result).toBe('a');
    });
  });

  describe('initials()', () => {
    it('should return first 2 chars of name', () => {
      expect(component.initials('Alice')).toBe('AL');
    });
  });
});
