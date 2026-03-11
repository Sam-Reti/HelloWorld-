import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { UserProfile as UserProfileComponent } from './user-profile';
import { provideFirebaseMocks, FAKE_USER, createMockActivatedRoute } from '../../testing/firebase-mocks';
import { FollowService } from '../services/follow.service';
import { ChatService } from '../services/chat.service';
import { ChatPopupService } from '../services/chat-popup.service';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { Auth, authState } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';

describe('UserProfileComponent', () => {
  let component: UserProfileComponent;
  let fixture: ComponentFixture<UserProfileComponent>;
  let mockFollowService: any;
  let mockChatService: any;
  let mockChatPopup: any;

  beforeEach(async () => {
    vi.resetAllMocks();
    (authState as any).mockReturnValue(of(FAKE_USER));

    mockFollowService = {
      isFollowing$: vi.fn().mockReturnValue(of(false)),
      follow: vi.fn().mockResolvedValue(undefined),
      unfollow: vi.fn().mockResolvedValue(undefined),
    };
    mockChatService = {
      getOrCreateConversation: vi.fn().mockResolvedValue('conv-1'),
    };
    mockChatPopup = {
      open: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [UserProfileComponent],
      providers: [
        ...provideFirebaseMocks({ Auth, Firestore }),
        { provide: FollowService, useValue: mockFollowService },
        { provide: ChatService, useValue: mockChatService },
        { provide: ChatPopupService, useValue: mockChatPopup },
        { provide: ActivatedRoute, useValue: createMockActivatedRoute({ uid: 'other-uid' }) },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(UserProfileComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('isOwnProfile', () => {
    it('should be false when viewing another user', () => {
      expect(component.isOwnProfile).toBe(false);
    });
  });

  describe('getInitials()', () => {
    it('should return "U" for null', () => {
      expect(component.getInitials(null)).toBe('U');
    });

    it('should return initials', () => {
      expect(component.getInitials('Other User')).toBe('OU');
    });
  });

  describe('toggle()', () => {
    it('should follow when not following', async () => {
      component.profile = { uid: 'other-uid', displayName: 'Other', bio: '', followerCount: 0, followingCount: 0 };
      await component.toggle(false);
      expect(mockFollowService.follow).toHaveBeenCalled();
    });

    it('should unfollow when following', async () => {
      component.profile = { uid: 'other-uid', displayName: 'Other', bio: '', followerCount: 0, followingCount: 0 };
      await component.toggle(true);
      expect(mockFollowService.unfollow).toHaveBeenCalled();
    });
  });

  describe('message()', () => {
    it('should open chat popup', async () => {
      component.profile = { displayName: 'Other', avatarColor: '#abc' } as any;
      await component.message();
      expect(mockChatService.getOrCreateConversation).toHaveBeenCalled();
      expect(mockChatPopup.open).toHaveBeenCalled();
    });
  });
});
