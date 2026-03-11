import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ChatPopup } from './chat-popup';
import { provideFirebaseMocks, FAKE_USER } from '../../testing/firebase-mocks';
import { ChatService } from '../services/chat.service';
import { ChatPopupService } from '../services/chat-popup.service';
import { PresenceService } from '../services/presence.service';
import { VideoCallService } from '../video-call/video-call.service';
import { of } from 'rxjs';

import { Auth, authState } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';

describe('ChatPopup', () => {
  let component: ChatPopup;
  let fixture: ComponentFixture<ChatPopup>;
  let mockChatService: any;
  let mockPopupService: ChatPopupService;

  beforeEach(async () => {
    vi.resetAllMocks();
    (authState as any).mockReturnValue(of(FAKE_USER));

    mockChatService = {
      sendMessage: vi.fn().mockResolvedValue(undefined),
      markRead: vi.fn().mockResolvedValue(undefined),
      getMessages$: vi.fn().mockReturnValue(of([])),
    };

    await TestBed.configureTestingModule({
      imports: [ChatPopup],
      providers: [
        ...provideFirebaseMocks({ Auth, Firestore }),
        { provide: ChatService, useValue: mockChatService },
        { provide: PresenceService, useValue: { onlineUsers$: of(new Set()) } },
        {
          provide: VideoCallService,
          useValue: {
            initiateCall: vi.fn().mockResolvedValue(undefined),
            activeCall: vi.fn().mockReturnValue(null),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatPopup);
    component = fixture.componentInstance;
    mockPopupService = TestBed.inject(ChatPopupService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('send()', () => {
    it('should send message and clear text', async () => {
      mockPopupService.open({
        conversationId: 'conv-1',
        name: 'Alice',
        color: '#f00',
        otherUid: 'u2',
      });
      component.text = 'Hello!';
      await component.send();
      expect(mockChatService.sendMessage).toHaveBeenCalledWith('conv-1', 'Hello!');
      expect(component.text).toBe('');
    });
  });

  describe('close()', () => {
    it('should close the popup', () => {
      mockPopupService.open({
        conversationId: 'conv-1',
        name: 'Alice',
        color: null,
        otherUid: 'u2',
      });
      component.close();
      expect(mockPopupService.openChat()).toBeNull();
    });
  });

  describe('getInitials()', () => {
    it('should return initials', () => {
      expect(component.getInitials('Alice Bob')).toBe('AB');
    });
  });
});
