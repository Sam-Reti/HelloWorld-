import { TestBed } from '@angular/core/testing';
import { CircleService } from './circle.service';
import { provideFirebaseMocks, FAKE_USER } from '../../testing/firebase-mocks';
import { of, firstValueFrom } from 'rxjs';

import { Auth, authState } from '@angular/fire/auth';
import {
  Firestore,
  collectionData,
  docData,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  doc,
} from '@angular/fire/firestore';
import { Storage, uploadBytes, getDownloadURL } from '@angular/fire/storage';

describe('CircleService', () => {
  let service: CircleService;

  beforeEach(() => {
    vi.resetAllMocks();
    (authState as any).mockReturnValue(of(FAKE_USER));
    (collection as any).mockReturnValue('col');
    (doc as any).mockReturnValue('docRef');
    (collectionData as any).mockReturnValue(of([]));

    TestBed.configureTestingModule({
      providers: [...provideFirebaseMocks({ Auth, Firestore, Storage })],
    });
    service = TestBed.inject(CircleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ── Observable queries ───────────────────────────────────────

  describe('getMyCircles$()', () => {
    it('should emit empty array when not logged in', async () => {
      (authState as any).mockReturnValue(of(null));
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [...provideFirebaseMocks({ Auth, Firestore, Storage })],
      });
      const svc = TestBed.inject(CircleService);

      const circles = await firstValueFrom(svc.getMyCircles$());
      expect(circles).toEqual([]);
    });

    it('should emit empty array when user has no memberships', async () => {
      (collectionData as any).mockReturnValue(of([]));
      const circles = await firstValueFrom(service.getMyCircles$());
      expect(circles).toEqual([]);
    });
  });

  describe('getPublicCircles$()', () => {
    it('should return observable from collectionData', async () => {
      const mockCircles = [{ id: 'c1', name: 'Public Circle' }];
      (collectionData as any).mockReturnValue(of(mockCircles));

      const result = await firstValueFrom(service.getPublicCircles$());
      expect(result).toEqual(mockCircles);
    });
  });

  describe('getCircle$()', () => {
    it('should return observable from docData', async () => {
      const mockCircle = { id: 'c1', name: 'Test Circle' };
      (docData as any).mockReturnValue(of(mockCircle));

      const result = await firstValueFrom(service.getCircle$('c1'));
      expect(result).toEqual(mockCircle);
    });
  });

  describe('getMembers$()', () => {
    it('should return members from collectionData', async () => {
      const mockMembers = [{ uid: 'u1', displayName: 'Alice', role: 'admin' }];
      (collectionData as any).mockReturnValue(of(mockMembers));

      const result = await firstValueFrom(service.getMembers$('c1'));
      expect(result).toEqual(mockMembers);
    });
  });

  describe('getMyMembership$()', () => {
    it('should return null when not logged in', async () => {
      (authState as any).mockReturnValue(of(null));
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [...provideFirebaseMocks({ Auth, Firestore, Storage })],
      });
      const svc = TestBed.inject(CircleService);

      const result = await firstValueFrom(svc.getMyMembership$('c1'));
      expect(result).toBeNull();
    });

    it('should return membership doc when it exists', async () => {
      const mockMember = { uid: FAKE_USER.uid, role: 'admin', status: 'active' };
      (collectionData as any).mockReturnValue(of([mockMember]));

      const result = await firstValueFrom(service.getMyMembership$('c1'));
      expect(result).toEqual(mockMember);
    });

    it('should return null when no membership doc exists', async () => {
      (collectionData as any).mockReturnValue(of([]));

      const result = await firstValueFrom(service.getMyMembership$('c1'));
      expect(result).toBeNull();
    });
  });

  // ── createCircle ─────────────────────────────────────────────

  describe('createCircle()', () => {
    it('should throw when not authenticated', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          ...provideFirebaseMocks({ Auth, Firestore, Storage }, { auth: { currentUser: null } as any }),
        ],
      });
      const svc = TestBed.inject(CircleService);
      await expect(svc.createCircle('Test', 'desc', 'public')).rejects.toThrow('Not authenticated');
    });

    it('should create circle and add creator as admin', async () => {
      (getDoc as any).mockResolvedValue({
        exists: () => true,
        data: () => ({ displayName: 'Test User', avatarColor: '#abc' }),
      });
      (addDoc as any).mockResolvedValue({ id: 'new-circle-id' });
      (setDoc as any).mockResolvedValue(undefined);

      const id = await service.createCircle('My Circle', 'A description', 'public');

      expect(id).toBe('new-circle-id');
      expect(addDoc).toHaveBeenCalledWith(
        'col',
        expect.objectContaining({
          name: 'My Circle',
          description: 'A description',
          visibility: 'public',
          creatorId: FAKE_USER.uid,
        }),
      );
      expect(setDoc).toHaveBeenCalledWith(
        'docRef',
        expect.objectContaining({
          uid: FAKE_USER.uid,
          role: 'admin',
          status: 'active',
        }),
      );
    });

    it('should upload banner when file is provided', async () => {
      (getDoc as any).mockResolvedValue({
        exists: () => true,
        data: () => ({ displayName: 'Test', avatarColor: '#abc' }),
      });
      (addDoc as any).mockResolvedValue({ id: 'c1' });
      (setDoc as any).mockResolvedValue(undefined);
      (uploadBytes as any).mockResolvedValue({});
      (getDownloadURL as any).mockResolvedValue('https://storage/banner.png');

      const file = new File(['img'], 'banner.png', { type: 'image/png' });
      await service.createCircle('Circle', 'desc', 'public', file);

      expect(uploadBytes).toHaveBeenCalled();
      expect(getDownloadURL).toHaveBeenCalled();
      expect(addDoc).toHaveBeenCalledWith(
        'col',
        expect.objectContaining({ bannerUrl: 'https://storage/banner.png' }),
      );
    });

    it('should trim name and description', async () => {
      (getDoc as any).mockResolvedValue({
        exists: () => true,
        data: () => ({ displayName: 'Test' }),
      });
      (addDoc as any).mockResolvedValue({ id: 'c1' });
      (setDoc as any).mockResolvedValue(undefined);

      await service.createCircle('  My Circle  ', '  desc  ', 'private');

      expect(addDoc).toHaveBeenCalledWith(
        'col',
        expect.objectContaining({ name: 'My Circle', description: 'desc' }),
      );
    });
  });

  // ── joinCircle ───────────────────────────────────────────────

  describe('joinCircle()', () => {
    it('should do nothing when not authenticated', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          ...provideFirebaseMocks({ Auth, Firestore, Storage }, { auth: { currentUser: null } as any }),
        ],
      });
      const svc = TestBed.inject(CircleService);
      await svc.joinCircle('c1');
      expect(setDoc).not.toHaveBeenCalled();
    });

    it('should do nothing when circle does not exist', async () => {
      (getDoc as any).mockResolvedValue({ exists: () => false });
      await service.joinCircle('c1');
      expect(setDoc).not.toHaveBeenCalled();
    });

    it('should set status active for public circles', async () => {
      (getDoc as any)
        .mockResolvedValueOnce({ exists: () => true, data: () => ({ visibility: 'public', creatorId: 'admin1', name: 'Circle' }) })
        .mockResolvedValueOnce({ exists: () => true, data: () => ({ displayName: 'User', avatarColor: '#abc' }) });
      (setDoc as any).mockResolvedValue(undefined);

      await service.joinCircle('c1');

      expect(setDoc).toHaveBeenCalledWith(
        'docRef',
        expect.objectContaining({ status: 'active', role: 'member' }),
      );
    });

    it('should set status pending for private circles and notify creator', async () => {
      (getDoc as any)
        .mockResolvedValueOnce({ exists: () => true, data: () => ({ visibility: 'private', creatorId: 'admin1', name: 'Private' }) })
        .mockResolvedValueOnce({ exists: () => true, data: () => ({ displayName: 'User' }) });
      (setDoc as any).mockResolvedValue(undefined);
      (addDoc as any).mockResolvedValue({ id: 'notif1' });

      await service.joinCircle('c1');

      expect(setDoc).toHaveBeenCalledWith(
        'docRef',
        expect.objectContaining({ status: 'pending' }),
      );
      expect(addDoc).toHaveBeenCalledWith(
        'col',
        expect.objectContaining({ type: 'circle_join_request' }),
      );
    });
  });

  // ── leaveCircle ──────────────────────────────────────────────

  describe('leaveCircle()', () => {
    it('should do nothing when not authenticated', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          ...provideFirebaseMocks({ Auth, Firestore, Storage }, { auth: { currentUser: null } as any }),
        ],
      });
      const svc = TestBed.inject(CircleService);
      await svc.leaveCircle('c1');
      expect(deleteDoc).not.toHaveBeenCalled();
    });

    it('should delete member document', async () => {
      (deleteDoc as any).mockResolvedValue(undefined);
      await service.leaveCircle('c1');
      expect(deleteDoc).toHaveBeenCalledWith('docRef');
    });
  });

  // ── approveMember / rejectMember ─────────────────────────────

  describe('approveMember()', () => {
    it('should update member status to active', async () => {
      (updateDoc as any).mockResolvedValue(undefined);
      await service.approveMember('c1', 'u1');
      expect(updateDoc).toHaveBeenCalledWith('docRef', { status: 'active' });
    });
  });

  describe('rejectMember()', () => {
    it('should delete member document', async () => {
      (deleteDoc as any).mockResolvedValue(undefined);
      await service.rejectMember('c1', 'u1');
      expect(deleteDoc).toHaveBeenCalledWith('docRef');
    });
  });

  // ── inviteMember ─────────────────────────────────────────────

  describe('inviteMember()', () => {
    it('should do nothing when not authenticated', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          ...provideFirebaseMocks({ Auth, Firestore, Storage }, { auth: { currentUser: null } as any }),
        ],
      });
      const svc = TestBed.inject(CircleService);
      await svc.inviteMember('c1', 'target');
      expect(setDoc).not.toHaveBeenCalled();
    });

    it('should do nothing when circle does not exist', async () => {
      (getDoc as any).mockResolvedValue({ exists: () => false });
      await service.inviteMember('c1', 'target');
      expect(setDoc).not.toHaveBeenCalled();
    });

    it('should create invited member and send notification', async () => {
      (getDoc as any)
        .mockResolvedValueOnce({ exists: () => true, data: () => ({ name: 'Circle' }) }) // circle
        .mockResolvedValueOnce({ exists: () => true, data: () => ({ displayName: 'Target', avatarColor: '#bbb' }) }); // target user
      (setDoc as any).mockResolvedValue(undefined);
      (addDoc as any).mockResolvedValue({ id: 'n1' });

      await service.inviteMember('c1', 'target-uid');

      expect(setDoc).toHaveBeenCalledWith(
        'docRef',
        expect.objectContaining({ uid: 'target-uid', status: 'invited', role: 'member' }),
      );
      expect(addDoc).toHaveBeenCalledWith(
        'col',
        expect.objectContaining({ type: 'circle_invite', circleId: 'c1' }),
      );
    });
  });

  // ── updateCircle ─────────────────────────────────────────────

  describe('updateCircle()', () => {
    it('should throw when not authenticated', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          ...provideFirebaseMocks({ Auth, Firestore, Storage }, { auth: { currentUser: null } as any }),
        ],
      });
      const svc = TestBed.inject(CircleService);
      await expect(svc.updateCircle('c1', 'name', 'desc')).rejects.toThrow('Not authenticated');
    });

    it('should update name and description', async () => {
      (updateDoc as any).mockResolvedValue(undefined);
      await service.updateCircle('c1', '  New Name  ', '  New Desc  ');
      expect(updateDoc).toHaveBeenCalledWith('docRef', {
        name: 'New Name',
        description: 'New Desc',
      });
    });

    it('should upload and include banner URL when file is provided', async () => {
      (uploadBytes as any).mockResolvedValue({});
      (getDownloadURL as any).mockResolvedValue('https://storage/new-banner.png');
      (updateDoc as any).mockResolvedValue(undefined);

      const file = new File(['img'], 'banner.png', { type: 'image/png' });
      await service.updateCircle('c1', 'Name', 'Desc', file);

      expect(uploadBytes).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalledWith('docRef', {
        name: 'Name',
        description: 'Desc',
        bannerUrl: 'https://storage/new-banner.png',
      });
    });
  });

  // ── deleteCircle ─────────────────────────────────────────────

  describe('deleteCircle()', () => {
    it('should delete the circle document', async () => {
      (deleteDoc as any).mockResolvedValue(undefined);
      await service.deleteCircle('c1');
      expect(deleteDoc).toHaveBeenCalledWith('docRef');
    });
  });

  // ── acceptInvite ─────────────────────────────────────────────

  describe('acceptInvite()', () => {
    it('should do nothing when not authenticated', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          ...provideFirebaseMocks({ Auth, Firestore, Storage }, { auth: { currentUser: null } as any }),
        ],
      });
      const svc = TestBed.inject(CircleService);
      await svc.acceptInvite('c1');
      expect(updateDoc).not.toHaveBeenCalled();
    });

    it('should update member status to active', async () => {
      (updateDoc as any).mockResolvedValue(undefined);
      await service.acceptInvite('c1');
      expect(updateDoc).toHaveBeenCalledWith('docRef', { status: 'active' });
    });
  });

  // ── Circle Posts ─────────────────────────────────────────────

  describe('createCirclePost()', () => {
    it('should throw when not authenticated', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          ...provideFirebaseMocks({ Auth, Firestore, Storage }, { auth: { currentUser: null } as any }),
        ],
      });
      const svc = TestBed.inject(CircleService);
      await expect(svc.createCirclePost('c1', 'text')).rejects.toThrow('Not authenticated');
    });

    it('should throw when text is empty and no image', async () => {
      await expect(service.createCirclePost('c1', '   ')).rejects.toThrow(
        'Post must have text or an image',
      );
    });

    it('should create post with text', async () => {
      (getDoc as any).mockResolvedValue({
        exists: () => true,
        data: () => ({ displayName: 'User', avatarColor: '#abc' }),
      });
      (addDoc as any).mockResolvedValue({ id: 'post-1' });

      const id = await service.createCirclePost('c1', '  Hello world  ');

      expect(id).toBe('post-1');
      expect(addDoc).toHaveBeenCalledWith(
        'col',
        expect.objectContaining({
          text: 'Hello world',
          authorId: FAKE_USER.uid,
          likeCount: 0,
          commentCount: 0,
        }),
      );
    });

    it('should upload image when provided', async () => {
      (getDoc as any).mockResolvedValue({
        exists: () => true,
        data: () => ({ displayName: 'User' }),
      });
      (addDoc as any).mockResolvedValue({ id: 'post-1' });
      (uploadBytes as any).mockResolvedValue({});
      (getDownloadURL as any).mockResolvedValue('https://storage/img.png');

      const file = new File(['img'], 'photo.png', { type: 'image/png' });
      await service.createCirclePost('c1', 'Look at this', file);

      expect(uploadBytes).toHaveBeenCalled();
      expect(addDoc).toHaveBeenCalledWith(
        'col',
        expect.objectContaining({ imageUrl: 'https://storage/img.png' }),
      );
    });
  });

  describe('getCirclePosts$()', () => {
    it('should return mapped posts from collectionData', async () => {
      const mockPosts = [
        { id: 'p1', text: 'Hello', createdAt: { toDate: () => new Date('2024-01-01') } },
      ];
      (collectionData as any).mockReturnValue(of(mockPosts));

      const posts = await firstValueFrom(service.getCirclePosts$('c1'));
      expect(posts.length).toBe(1);
      expect(posts[0].text).toBe('Hello');
    });
  });

  describe('toggleCirclePostLike()', () => {
    it('should do nothing when not authenticated', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          ...provideFirebaseMocks({ Auth, Firestore, Storage }, { auth: { currentUser: null } as any }),
        ],
      });
      const svc = TestBed.inject(CircleService);
      await svc.toggleCirclePostLike('c1', 'p1');
      expect(getDoc).not.toHaveBeenCalled();
    });

    it('should unlike when already liked', async () => {
      (getDoc as any).mockResolvedValue({ exists: () => true });
      (deleteDoc as any).mockResolvedValue(undefined);
      (updateDoc as any).mockResolvedValue(undefined);

      await service.toggleCirclePostLike('c1', 'p1');

      expect(deleteDoc).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalled();
    });

    it('should like when not already liked', async () => {
      (getDoc as any).mockResolvedValue({ exists: () => false });
      (setDoc as any).mockResolvedValue(undefined);
      (updateDoc as any).mockResolvedValue(undefined);

      await service.toggleCirclePostLike('c1', 'p1');

      expect(setDoc).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalled();
    });
  });

  describe('hasLikedCirclePost()', () => {
    it('should return false when not authenticated', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          ...provideFirebaseMocks({ Auth, Firestore, Storage }, { auth: { currentUser: null } as any }),
        ],
      });
      const svc = TestBed.inject(CircleService);
      expect(await svc.hasLikedCirclePost('c1', 'p1')).toBe(false);
    });

    it('should return true when like doc exists', async () => {
      (getDoc as any).mockResolvedValue({ exists: () => true });
      expect(await service.hasLikedCirclePost('c1', 'p1')).toBe(true);
    });

    it('should return false when like doc does not exist', async () => {
      (getDoc as any).mockResolvedValue({ exists: () => false });
      expect(await service.hasLikedCirclePost('c1', 'p1')).toBe(false);
    });
  });

  // ── Circle Comments ──────────────────────────────────────────

  describe('addCircleComment()', () => {
    it('should throw when not authenticated', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          ...provideFirebaseMocks({ Auth, Firestore, Storage }, { auth: { currentUser: null } as any }),
        ],
      });
      const svc = TestBed.inject(CircleService);
      await expect(svc.addCircleComment('c1', 'p1', 'comment')).rejects.toThrow(
        'Not authenticated',
      );
    });

    it('should skip empty text', async () => {
      await service.addCircleComment('c1', 'p1', '   ');
      expect(addDoc).not.toHaveBeenCalled();
    });

    it('should create comment and increment count', async () => {
      (getDoc as any).mockResolvedValue({
        exists: () => true,
        data: () => ({ displayName: 'User', avatarColor: '#abc' }),
      });
      (addDoc as any).mockResolvedValue({ id: 'comment-1' });
      (updateDoc as any).mockResolvedValue(undefined);

      await service.addCircleComment('c1', 'p1', '  Nice post!  ');

      expect(addDoc).toHaveBeenCalledWith(
        'col',
        expect.objectContaining({ text: 'Nice post!', authorId: FAKE_USER.uid }),
      );
      expect(updateDoc).toHaveBeenCalled();
    });
  });

  describe('getCircleComments$()', () => {
    it('should return comments from collectionData', async () => {
      const comments = [{ id: 'cm1', text: 'Great', authorId: 'u1' }];
      (collectionData as any).mockReturnValue(of(comments));

      const result = await firstValueFrom(service.getCircleComments$('c1', 'p1'));
      expect(result).toEqual(comments);
    });
  });

  // ── Delete/Update Circle Post ────────────────────────────────

  describe('deleteCirclePost()', () => {
    it('should delete the post doc', async () => {
      (deleteDoc as any).mockResolvedValue(undefined);
      await service.deleteCirclePost('c1', 'p1');
      expect(deleteDoc).toHaveBeenCalledWith('docRef');
    });
  });

  describe('updateCirclePost()', () => {
    it('should update the post text trimmed', async () => {
      (updateDoc as any).mockResolvedValue(undefined);
      await service.updateCirclePost('c1', 'p1', '  Updated text  ');
      expect(updateDoc).toHaveBeenCalledWith('docRef', { text: 'Updated text' });
    });
  });

  // ── Circle Chat ──────────────────────────────────────────────

  describe('enableChat()', () => {
    it('should set chatEnabled to true', async () => {
      (updateDoc as any).mockResolvedValue(undefined);
      await service.enableChat('c1');
      expect(updateDoc).toHaveBeenCalledWith('docRef', { chatEnabled: true });
    });
  });

  describe('sendCircleMessage()', () => {
    it('should throw when not authenticated', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          ...provideFirebaseMocks({ Auth, Firestore, Storage }, { auth: { currentUser: null } as any }),
        ],
      });
      const svc = TestBed.inject(CircleService);
      await expect(svc.sendCircleMessage('c1', 'hello')).rejects.toThrow('Not authenticated');
    });

    it('should skip empty text', async () => {
      await service.sendCircleMessage('c1', '   ');
      expect(addDoc).not.toHaveBeenCalled();
    });

    it('should create message doc', async () => {
      (getDoc as any).mockResolvedValue({
        exists: () => true,
        data: () => ({ displayName: 'User', avatarColor: '#abc' }),
      });
      (addDoc as any).mockResolvedValue({ id: 'msg-1' });

      await service.sendCircleMessage('c1', '  Hello everyone  ');

      expect(addDoc).toHaveBeenCalledWith(
        'col',
        expect.objectContaining({
          senderId: FAKE_USER.uid,
          text: 'Hello everyone',
        }),
      );
    });
  });

  describe('getCircleMessages$()', () => {
    it('should return messages from collectionData', async () => {
      const msgs = [{ id: 'm1', text: 'Hi', senderId: 'u1' }];
      (collectionData as any).mockReturnValue(of(msgs));

      const result = await firstValueFrom(service.getCircleMessages$('c1'));
      expect(result).toEqual(msgs);
    });
  });
});
