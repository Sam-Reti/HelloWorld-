import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Feed } from './feed';
import { provideFirebaseMocks, FAKE_USER, createMockActivatedRoute } from '../../testing/firebase-mocks';
import { PostService } from '../services/postservice';
import { ScrollService } from '../services/scroll.service';
import { FollowService } from '../services/follow.service';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { Auth, authState } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { getDoc } from 'firebase/firestore';

describe('Feed', () => {
  let component: Feed;
  let fixture: ComponentFixture<Feed>;
  let mockPostService: any;

  beforeEach(async () => {
    vi.resetAllMocks();
    (authState as any).mockReturnValue(of(FAKE_USER));
    (getDoc as any).mockResolvedValue({ exists: () => false, data: () => null });

    mockPostService = {
      createPost: vi.fn().mockResolvedValue('new-post'),
      deletePost: vi.fn().mockResolvedValue(undefined),
      toggleLike: vi.fn().mockResolvedValue(undefined),
      addComment: vi.fn().mockResolvedValue(undefined),
      getComments: vi.fn().mockReturnValue(of([])),
      hasLiked: vi.fn().mockResolvedValue(false),
      getPostsPage: vi.fn().mockResolvedValue({ posts: [], cursors: [], hasMore: false }),
      updatePost: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [Feed],
      providers: [
        ...provideFirebaseMocks({ Auth, Firestore }),
        { provide: PostService, useValue: mockPostService },
        { provide: ScrollService, useValue: { scrollToPost$: of(null), refresh$: of() } },
        {
          provide: FollowService,
          useValue: {
            getFollowingIds$: vi.fn().mockReturnValue(of(['uid-a'])),
            getAllUsers$: vi.fn().mockReturnValue(of([])),
          },
        },
        { provide: ActivatedRoute, useValue: createMockActivatedRoute() },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(Feed);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('createPost()', () => {
    it('should call postService.createPost and clear text', async () => {
      component.text = 'Hello world';
      await component.createPost();
      expect(mockPostService.createPost).toHaveBeenCalledWith('Hello world', null, []);
      expect(component.text).toBe('');
    });
  });

  describe('delete()', () => {
    it('should call deletePost and remove from local list', async () => {
      component.posts.set([
        { id: 'p1', text: 'hi', authorId: 'u1', authorName: null, createdAt: new Date(), likeCount: 0, commentCount: 0 },
      ]);
      await component.delete('p1');
      expect(mockPostService.deletePost).toHaveBeenCalledWith('p1');
      expect(component.posts().length).toBe(0);
    });
  });

  describe('toggleLike()', () => {
    it('should optimistically toggle like state', async () => {
      component.posts.set([
        { id: 'p1', text: 'hi', authorId: 'u1', authorName: null, createdAt: new Date(), likeCount: 0, commentCount: 0 },
      ]);
      expect(component.isLiked('p1')).toBe(false);

      await component.toggleLike('p1');

      expect(component.isLiked('p1')).toBe(true);
      expect(component.posts()[0].likeCount).toBe(1);
    });
  });

  describe('submitComment()', () => {
    it('should call addComment and clear text', async () => {
      component.commentText['p1'] = 'Nice!';
      await component.submitComment('p1');
      expect(mockPostService.addComment).toHaveBeenCalledWith('p1', 'Nice!', []);
      expect(component.commentText['p1']).toBe('');
    });

    it('should skip empty comment', async () => {
      component.commentText['p1'] = '   ';
      await component.submitComment('p1');
      expect(mockPostService.addComment).not.toHaveBeenCalled();
    });
  });

  describe('getInitials()', () => {
    it('should return "U" for null', () => {
      expect(component.getInitials(null)).toBe('U');
    });

    it('should return first 2 chars for single name', () => {
      expect(component.getInitials('Alice')).toBe('AL');
    });

    it('should return initials for full name', () => {
      expect(component.getInitials('Jane Doe')).toBe('JD');
    });
  });

  describe('toggleComments()', () => {
    it('should toggle showComments for a post', () => {
      component.toggleComments('p1');
      expect(component.showComments['p1']).toBe(true);
      component.toggleComments('p1');
      expect(component.showComments['p1']).toBe(false);
    });
  });

  describe('edit flow', () => {
    it('startEdit should set editing state', () => {
      const post = { id: 'p1', text: 'hello', type: undefined } as any;
      component.startEdit(post);
      expect(component.editingPostId).toBe('p1');
      expect(component.editText).toBe('hello');
    });

    it('cancelEdit should clear editing state', () => {
      component.editingPostId = 'p1';
      component.editText = 'draft';
      component.cancelEdit();
      expect(component.editingPostId).toBeNull();
      expect(component.editText).toBe('');
    });
  });
});
