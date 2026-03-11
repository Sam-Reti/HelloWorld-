import { TestBed } from '@angular/core/testing';
import { PresenceService } from './presence.service';
import { provideFirebaseMocks, FAKE_USER } from '../../testing/firebase-mocks';
import { of, firstValueFrom } from 'rxjs';

import { Auth, authState } from '@angular/fire/auth';
import { Firestore, collectionData, updateDoc } from '@angular/fire/firestore';

describe('PresenceService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    (authState as any).mockReturnValue(of(FAKE_USER));
    (updateDoc as any).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function createService(usersData: any[] = []) {
    (collectionData as any).mockReturnValue(of(usersData));

    TestBed.configureTestingModule({
      providers: [...provideFirebaseMocks({ Auth, Firestore })],
    });
    return TestBed.inject(PresenceService);
  }

  it('should be created', () => {
    const service = createService();
    expect(service).toBeTruthy();
  });

  it('should write presence on creation (heartbeat)', () => {
    createService();
    expect(updateDoc).toHaveBeenCalledWith('docRef', { lastSeen: 'SERVER_TS' });
  });

  describe('onlineUsers$', () => {
    it('should filter users by 2min threshold', async () => {
      const now = Date.now();
      const usersData = [
        { uid: 'online-user', lastSeen: { toDate: () => new Date(now - 30_000) } }, // 30s ago
        { uid: 'offline-user', lastSeen: { toDate: () => new Date(now - 300_000) } }, // 5min ago
      ];

      const service = createService(usersData);
      const online = await firstValueFrom(service.onlineUsers$);

      expect(online.has('online-user')).toBe(true);
      expect(online.has('offline-user')).toBe(false);
    });

    it('should return empty set when not authenticated', async () => {
      (authState as any).mockReturnValue(of(null));
      (collectionData as any).mockReturnValue(of([]));

      TestBed.configureTestingModule({
        providers: [...provideFirebaseMocks({ Auth, Firestore })],
      });
      const service = TestBed.inject(PresenceService);
      const online = await firstValueFrom(service.onlineUsers$);

      expect(online.size).toBe(0);
    });

    it('should skip users with no lastSeen', async () => {
      const usersData = [{ uid: 'no-seen' }];
      const service = createService(usersData);
      const online = await firstValueFrom(service.onlineUsers$);

      expect(online.has('no-seen')).toBe(false);
    });
  });

  it('should clean up subscriptions on destroy', () => {
    const service = createService();
    // Should not throw
    service.ngOnDestroy();
  });
});
