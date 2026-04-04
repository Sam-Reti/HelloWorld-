import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ChatSidebar } from './chat-sidebar';
import { provideFirebaseMocks, FAKE_USER } from '../../testing/firebase-mocks';
import { ChatService, Conversation } from '../services/chat.service';
import { ChatPopupService } from '../services/chat-popup.service';
import { FollowService } from '../services/follow.service';
import { PresenceService } from '../services/presence.service';
import { VideoCallService } from '../video-call/video-call.service';
import { of, BehaviorSubject } from 'rxjs';

import { Auth, authState } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';

describe('ChatSidebar', () => {
  let component: ChatSidebar;
  let fixture: ComponentFixture<ChatSidebar>;

  const fakeConvo: Conversation = {
    id: 'conv-1',
    participantIds: [FAKE_USER.uid, 'other-uid'],
    participantNames: { [FAKE_USER.uid]: 'Test', 'other-uid': 'Alice' },
    participantColors: { [FAKE_USER.uid]: '#aaa', 'other-uid': '#bbb' },
    lastMessage: 'Hi',
    lastMessageAt: new Date(),
    lastMessageSenderId: 'other-uid',
    unreadBy: [FAKE_USER.uid],
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    (authState as any).mockReturnValue(of(FAKE_USER));

    await TestBed.configureTestingModule({
      imports: [ChatSidebar],
      providers: [
        ...provideFirebaseMocks({ Auth, Firestore }),
        {
          provide: ChatService,
          useValue: {
            getConversations$: vi.fn().mockReturnValue(of([fakeConvo])),
            getOrCreateConversation: vi.fn().mockResolvedValue('conv-new'),
          },
        },
        { provide: ChatPopupService, useValue: { open: vi.fn(), openChat: vi.fn().mockReturnValue(null) } },
        {
          provide: FollowService,
          useValue: {
            getFollowingIds$: vi.fn().mockReturnValue(of([])),
            getAllUsers$: vi.fn().mockReturnValue(of([])),
          },
        },
        { provide: PresenceService, useValue: { onlineUsers$: of(new Set(['other-uid'])) } },
        {
          provide: VideoCallService,
          useValue: {
            initiateCall: vi.fn(),
            isInRoom$: new BehaviorSubject(false),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatSidebar);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('getOtherName()', () => {
    it('should return the other participants name', () => {
      expect(component.getOtherName(fakeConvo)).toBe('Alice');
    });
  });

  describe('getInitials()', () => {
    it('should return initials', () => {
      expect(component.getInitials('Alice')).toBe('AL');
    });
  });

  describe('isUnread()', () => {
    it('should return true when current user is in unreadBy', () => {
      expect(component.isUnread(fakeConvo)).toBe(true);
    });

    it('should return false when unreadBy is empty', () => {
      const read = { ...fakeConvo, unreadBy: [] };
      expect(component.isUnread(read)).toBe(false);
    });
  });

  describe('getOtherUid()', () => {
    it('should return the other UID from conversation', () => {
      expect(component.getOtherUid(fakeConvo)).toBe('other-uid');
    });
  });
});
