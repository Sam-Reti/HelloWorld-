import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Discover as DiscoverComponent } from './discover';
import { provideFirebaseMocks, FAKE_USER } from '../../testing/firebase-mocks';
import { FollowService } from '../services/follow.service';
import { of } from 'rxjs';

import { Auth, authState } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';

describe('DiscoverComponent', () => {
  let component: DiscoverComponent;
  let fixture: ComponentFixture<DiscoverComponent>;
  let mockFollowService: any;

  beforeEach(async () => {
    vi.resetAllMocks();
    (authState as any).mockReturnValue(of(FAKE_USER));

    mockFollowService = {
      getAllUsers$: vi.fn().mockReturnValue(of([
        { uid: 'u1', displayName: 'Alice', bio: '', followerCount: 0, followingCount: 0 },
        { uid: 'u2', displayName: 'Bob', bio: '', followerCount: 0, followingCount: 0 },
      ])),
      getFollowingIds$: vi.fn().mockReturnValue(of(['u1'])),
      follow: vi.fn().mockResolvedValue(undefined),
      unfollow: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [DiscoverComponent],
      providers: [
        ...provideFirebaseMocks({ Auth, Firestore }),
        { provide: FollowService, useValue: mockFollowService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(DiscoverComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('getInitials()', () => {
    it('should return "U" for empty value', () => {
      expect(component.getInitials('')).toBe('U');
    });

    it('should return initials for two-word name', () => {
      expect(component.getInitials('Jane Doe')).toBe('JD');
    });
  });

  describe('toggle()', () => {
    it('should call follow when not following', async () => {
      await component.toggle('u2', false);
      expect(mockFollowService.follow).toHaveBeenCalledWith('u2');
    });

    it('should call unfollow when following', async () => {
      await component.toggle('u1', true);
      expect(mockFollowService.unfollow).toHaveBeenCalledWith('u1');
    });
  });
});
