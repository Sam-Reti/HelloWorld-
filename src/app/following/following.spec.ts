import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Following as FollowingComponent } from './following';
import { provideFirebaseMocks, FAKE_USER } from '../../testing/firebase-mocks';
import { FollowService } from '../services/follow.service';
import { ChatService } from '../services/chat.service';
import { ChatPopupService } from '../services/chat-popup.service';
import { of } from 'rxjs';

import { Auth, authState } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';

describe('FollowingComponent', () => {
  let component: FollowingComponent;
  let fixture: ComponentFixture<FollowingComponent>;
  let mockFollowService: any;
  let mockChatService: any;
  let mockChatPopup: any;

  beforeEach(async () => {
    vi.resetAllMocks();
    (authState as any).mockReturnValue(of(FAKE_USER));

    mockFollowService = {
      getFollowingIds$: vi.fn().mockReturnValue(of(['u1'])),
      getAllUsers$: vi.fn().mockReturnValue(of([
        { uid: 'u1', displayName: 'Alice', bio: 'Hi', avatarColor: '#f00', followerCount: 0, followingCount: 0 },
      ])),
      unfollow: vi.fn().mockResolvedValue(undefined),
    };
    mockChatService = { getOrCreateConversation: vi.fn().mockResolvedValue('conv-1') };
    mockChatPopup = { open: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [FollowingComponent],
      providers: [
        ...provideFirebaseMocks({ Auth, Firestore }),
        { provide: FollowService, useValue: mockFollowService },
        { provide: ChatService, useValue: mockChatService },
        { provide: ChatPopupService, useValue: mockChatPopup },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(FollowingComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('getInitials()', () => {
    it('should return initials for name', () => {
      expect(component.getInitials('Alice')).toBe('AL');
    });
  });

  describe('unfollow()', () => {
    it('should call followService.unfollow', async () => {
      await component.unfollow('u1');
      expect(mockFollowService.unfollow).toHaveBeenCalledWith('u1');
    });
  });

  describe('openChat()', () => {
    it('should open chat popup for user', async () => {
      const user = { uid: 'u1', displayName: 'Alice', avatarColor: '#f00' } as any;
      await component.openChat(user);
      expect(mockChatService.getOrCreateConversation).toHaveBeenCalledWith('u1');
      expect(mockChatPopup.open).toHaveBeenCalled();
    });
  });
});
