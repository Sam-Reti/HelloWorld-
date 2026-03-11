import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FollowingSidebar } from './following-sidebar';
import { FollowService } from '../services/follow.service';
import { ChatService } from '../services/chat.service';
import { ChatPopupService } from '../services/chat-popup.service';
import { of } from 'rxjs';

import { authState } from '@angular/fire/auth';

describe('FollowingSidebar', () => {
  let component: FollowingSidebar;
  let fixture: ComponentFixture<FollowingSidebar>;
  let mockChatPopup: any;

  beforeEach(async () => {
    vi.resetAllMocks();
    (authState as any).mockReturnValue(of({ uid: 'me' }));

    mockChatPopup = { open: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [FollowingSidebar],
      providers: [
        {
          provide: FollowService,
          useValue: {
            getFollowingIds$: vi.fn().mockReturnValue(of(['u1'])),
            getAllUsers$: vi.fn().mockReturnValue(of([
              { uid: 'u1', displayName: 'Alice', avatarColor: '#f00', bio: '', followerCount: 0, followingCount: 0 },
            ])),
          },
        },
        { provide: ChatService, useValue: { getOrCreateConversation: vi.fn().mockResolvedValue('conv-1') } },
        { provide: ChatPopupService, useValue: mockChatPopup },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(FollowingSidebar);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('getInitials()', () => {
    it('should return first 2 chars for single name', () => {
      expect(component.getInitials('Alice')).toBe('AL');
    });
  });

  describe('openChat()', () => {
    it('should open chat popup', async () => {
      const user = { uid: 'u1', displayName: 'Alice', avatarColor: '#f00' } as any;
      await component.openChat(user);
      expect(mockChatPopup.open).toHaveBeenCalled();
    });
  });
});
