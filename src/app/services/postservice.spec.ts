import { TestBed } from '@angular/core/testing';
import { PostService } from './postservice';
import { provideFirebaseMocks, FAKE_USER } from '../../testing/firebase-mocks';

// No vi.mock calls here -- they're in the global setup file (src/testing/setup.ts).
// We just import the mocked modules and configure mock behaviors in beforeEach.

import { Auth } from '@angular/fire/auth';
import { Firestore, collection, doc, updateDoc, addDoc } from '@angular/fire/firestore';
import { Storage } from '@angular/fire/storage';
import { getDoc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';

describe('PostService', () => {
  let service: PostService;

  beforeEach(() => {
    vi.resetAllMocks();

    // Re-set default return values after clearAllMocks resets them
    (collection as any).mockReturnValue('postsCol');
    (doc as any).mockReturnValue('docRef');

    TestBed.configureTestingModule({
      providers: [...provideFirebaseMocks({ Auth, Firestore, Storage })],
    });
    service = TestBed.inject(PostService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createPost()', () => {
    it('should throw when not authenticated', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [...provideFirebaseMocks({ Auth, Firestore, Storage }, { auth: { currentUser: null } as any })],
      });
      const svc = TestBed.inject(PostService);

      await expect(svc.createPost('hello')).rejects.toThrow('Not authenticated');
    });

    it('should throw when text is empty and no image', async () => {
      await expect(service.createPost('   ')).rejects.toThrow('Post must have text or an image');
    });

    it('should create a post with trimmed text', async () => {
      (getDoc as any).mockResolvedValue({
        exists: () => true,
        data: () => ({ displayName: 'Test', avatarColor: '#000' }),
      });
      (addDoc as any).mockResolvedValue({ id: 'new-post-id' });

      const result = await service.createPost('  hello world  ');

      expect(addDoc).toHaveBeenCalledWith(
        'postsCol',
        expect.objectContaining({
          text: 'hello world',
          authorId: FAKE_USER.uid,
        }),
      );
      expect(result).toBe('new-post-id');
    });
  });

  describe('deletePost()', () => {
    it('should delete the post document', async () => {
      (deleteDoc as any).mockResolvedValue(undefined);
      await service.deletePost('post-1');
      expect(deleteDoc).toHaveBeenCalledWith('docRef');
    });
  });

  describe('updatePost()', () => {
    it('should throw when not authenticated', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [...provideFirebaseMocks({ Auth, Firestore, Storage }, { auth: { currentUser: null } as any })],
      });
      const svc = TestBed.inject(PostService);
      await expect(svc.updatePost('p1', 'text')).rejects.toThrow('Not authenticated');
    });

    it('should update the post text', async () => {
      (updateDoc as any).mockResolvedValue(undefined);
      await service.updatePost('p1', '  trimmed  ');
      expect(updateDoc).toHaveBeenCalledWith('docRef', { text: 'trimmed' });
    });
  });

  describe('toggleLike()', () => {
    it('should unlike when already liked', async () => {
      (getDoc as any)
        .mockResolvedValueOnce({ exists: () => true }) // likeSnap
        .mockResolvedValueOnce({ exists: () => true, data: () => ({ authorId: 'other-user' }) }); // postSnap
      (deleteDoc as any).mockResolvedValue(undefined);
      (updateDoc as any).mockResolvedValue(undefined);

      await service.toggleLike('post-1');

      expect(deleteDoc).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalled();
    });

    it('should like and send notification when liking another users post', async () => {
      (getDoc as any)
        .mockResolvedValueOnce({ exists: () => false }) // likeSnap (not liked)
        .mockResolvedValueOnce({ exists: () => true, data: () => ({ authorId: 'other-uid' }) }); // postSnap
      (setDoc as any).mockResolvedValue(undefined);
      (updateDoc as any).mockResolvedValue(undefined);
      (addDoc as any).mockResolvedValue({ id: 'notif-1' });

      await service.toggleLike('post-1');

      expect(setDoc).toHaveBeenCalled();
      expect(addDoc).toHaveBeenCalled(); // notification
    });

    it('should not send notification when liking own post', async () => {
      (getDoc as any)
        .mockResolvedValueOnce({ exists: () => false })
        .mockResolvedValueOnce({ exists: () => true, data: () => ({ authorId: FAKE_USER.uid }) });
      (setDoc as any).mockResolvedValue(undefined);
      (updateDoc as any).mockResolvedValue(undefined);

      await service.toggleLike('post-1');

      expect(addDoc).not.toHaveBeenCalled();
    });

    it('should do nothing when no user', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [...provideFirebaseMocks({ Auth, Firestore, Storage }, { auth: { currentUser: null } as any })],
      });
      const svc = TestBed.inject(PostService);
      await svc.toggleLike('post-1');
      expect(getDoc).not.toHaveBeenCalled();
    });
  });

  describe('addComment()', () => {
    it('should throw when not authenticated', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [...provideFirebaseMocks({ Auth, Firestore, Storage }, { auth: { currentUser: null } as any })],
      });
      const svc = TestBed.inject(PostService);
      await expect(svc.addComment('p1', 'text')).rejects.toThrow('Not authenticated');
    });

    it('should skip empty comments', async () => {
      await service.addComment('p1', '   ');
      expect(getDoc).not.toHaveBeenCalled();
    });

    it('should create comment doc and increment count', async () => {
      (getDoc as any)
        .mockResolvedValueOnce({ exists: () => true, data: () => ({ authorId: 'other-uid' }) }) // postSnap
        .mockResolvedValueOnce({ exists: () => true, data: () => ({ avatarColor: '#f00' }) }); // userSnap
      (addDoc as any).mockResolvedValue({ id: 'comment-1' });
      (updateDoc as any).mockResolvedValue(undefined);
      (setDoc as any).mockResolvedValue(undefined);

      await service.addComment('p1', 'Nice post!');

      expect(addDoc).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalled();
    });
  });

  describe('getPostsPage()', () => {
    it('should return empty for empty uids', async () => {
      const result = await service.getPostsPage([]);
      expect(result).toEqual({ posts: [], cursors: [], hasMore: false });
    });

    it('should query and return paginated posts', async () => {
      (getDocs as any).mockResolvedValue({
        docs: [
          { id: 'p1', data: () => ({ text: 'hi', authorId: 'u1', createdAt: { toDate: () => new Date('2024-01-01') } }) },
        ],
      });

      const result = await service.getPostsPage(['u1']);
      expect(result.posts).toHaveLength(1);
      expect(result.posts[0].id).toBe('p1');
    });
  });

  describe('hasLiked()', () => {
    it('should return false when not authenticated', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [...provideFirebaseMocks({ Auth, Firestore, Storage }, { auth: { currentUser: null } as any })],
      });
      const svc = TestBed.inject(PostService);
      const result = await svc.hasLiked('p1');
      expect(result).toBe(false);
    });

    it('should return true when like exists', async () => {
      (getDoc as any).mockResolvedValue({ exists: () => true });
      const result = await service.hasLiked('p1');
      expect(result).toBe(true);
    });

    it('should return false when like does not exist', async () => {
      (getDoc as any).mockResolvedValue({ exists: () => false });
      const result = await service.hasLiked('p1');
      expect(result).toBe(false);
    });
  });
});
