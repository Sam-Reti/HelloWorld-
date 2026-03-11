import { TestBed } from '@angular/core/testing';
import { FollowService } from './follow.service';
import { provideFirebaseMocks, FAKE_USER } from '../../testing/firebase-mocks';
import { of, firstValueFrom } from 'rxjs';

import { Auth, authState } from '@angular/fire/auth';
import { Firestore, collectionData, doc, addDoc } from '@angular/fire/firestore';
import { runTransaction } from 'firebase/firestore';

describe('FollowService', () => {
  let service: FollowService;

  beforeEach(() => {
    vi.resetAllMocks();
    (authState as any).mockReturnValue(of(FAKE_USER));
    (collectionData as any).mockReturnValue(of([]));

    TestBed.configureTestingModule({
      providers: [...provideFirebaseMocks({ Auth, Firestore })],
    });
    service = TestBed.inject(FollowService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getFollowingIds$()', () => {
    it('should emit empty array when not logged in', async () => {
      (authState as any).mockReturnValue(of(null));
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [...provideFirebaseMocks({ Auth, Firestore })] });
      const svc = TestBed.inject(FollowService);

      const ids = await firstValueFrom(svc.getFollowingIds$());
      expect(ids).toEqual([]);
    });

    it('should emit UIDs from following collection', async () => {
      (collectionData as any).mockReturnValue(of([{ uid: 'a' }, { uid: 'b' }]));

      const ids = await firstValueFrom(service.getFollowingIds$());
      expect(ids).toEqual(['a', 'b']);
    });
  });

  describe('isFollowing$()', () => {
    it('should return true when target is in following list', async () => {
      (collectionData as any).mockReturnValue(of([{ uid: 'target-uid' }]));

      const result = await firstValueFrom(service.isFollowing$('target-uid'));
      expect(result).toBe(true);
    });

    it('should return false when target is not in following list', async () => {
      (collectionData as any).mockReturnValue(of([{ uid: 'other' }]));

      const result = await firstValueFrom(service.isFollowing$('target-uid'));
      expect(result).toBe(false);
    });
  });

  describe('follow()', () => {
    it('should block self-follow', async () => {
      await service.follow(FAKE_USER.uid);
      expect(runTransaction).not.toHaveBeenCalled();
    });

    it('should do nothing when not authenticated', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [...provideFirebaseMocks({ Auth, Firestore }, { auth: { currentUser: null } as any })],
      });
      const svc = TestBed.inject(FollowService);
      await svc.follow('target');
      expect(runTransaction).not.toHaveBeenCalled();
    });

    it('should run transaction and send notification', async () => {
      (runTransaction as any).mockResolvedValue(undefined);
      (addDoc as any).mockResolvedValue({ id: 'notif-1' });

      await service.follow('target-uid');

      expect(runTransaction).toHaveBeenCalled();
      expect(addDoc).toHaveBeenCalledWith(
        'col',
        expect.objectContaining({ type: 'follow', actorId: FAKE_USER.uid }),
      );
    });
  });

  describe('unfollow()', () => {
    it('should block self-unfollow', async () => {
      await service.unfollow(FAKE_USER.uid);
      expect(runTransaction).not.toHaveBeenCalled();
    });

    it('should run transaction to remove follow', async () => {
      (runTransaction as any).mockResolvedValue(undefined);

      await service.unfollow('target-uid');
      expect(runTransaction).toHaveBeenCalled();
    });
  });
});
