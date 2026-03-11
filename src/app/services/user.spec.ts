import { TestBed } from '@angular/core/testing';
import { User } from './user';
import { provideFirebaseMocks, FAKE_USER } from '../../testing/firebase-mocks';
import { of } from 'rxjs';

import { Auth, authState } from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';

describe('User service', () => {
  let service: User;

  beforeEach(() => {
    vi.resetAllMocks();
    (authState as any).mockReturnValue(of(FAKE_USER));
    (doc as any).mockReturnValue('userDocRef');

    TestBed.configureTestingModule({
      providers: [...provideFirebaseMocks({ Auth, Firestore })],
    });
    service = TestBed.inject(User);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('ensureUserProfile()', () => {
    it('should do nothing when no user is logged in', async () => {
      (authState as any).mockReturnValue(of(null));
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [...provideFirebaseMocks({ Auth, Firestore })] });
      const svc = TestBed.inject(User);

      await svc.ensureUserProfile();
      expect(getDoc).not.toHaveBeenCalled();
    });

    it('should skip creation if profile already exists', async () => {
      (getDoc as any).mockResolvedValue({ exists: () => true });

      await service.ensureUserProfile();
      expect(getDoc).toHaveBeenCalled();
      expect(setDoc).not.toHaveBeenCalled();
    });

    it('should create profile with defaults if new user', async () => {
      (getDoc as any).mockResolvedValue({ exists: () => false });
      (setDoc as any).mockResolvedValue(undefined);

      await service.ensureUserProfile();

      expect(setDoc).toHaveBeenCalledWith(
        'userDocRef',
        expect.objectContaining({
          displayName: 'Test User',
          bio: '',
          avatarColor: '#0ea5a4',
          followerCount: 0,
          followingCount: 0,
        }),
        { merge: true },
      );
    });

    it('should fallback to email prefix when displayName is null', async () => {
      (authState as any).mockReturnValue(of({ ...FAKE_USER, displayName: null }));
      (getDoc as any).mockResolvedValue({ exists: () => false });
      (setDoc as any).mockResolvedValue(undefined);

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [...provideFirebaseMocks({ Auth, Firestore })] });
      const svc = TestBed.inject(User);
      await svc.ensureUserProfile();

      expect(setDoc).toHaveBeenCalledWith(
        'userDocRef',
        expect.objectContaining({ displayName: 'test' }),
        { merge: true },
      );
    });

    it('should fallback to "New User" when no displayName and no email', async () => {
      (authState as any).mockReturnValue(of({ uid: 'u1', displayName: null, email: null, emailVerified: true }));
      (getDoc as any).mockResolvedValue({ exists: () => false });
      (setDoc as any).mockResolvedValue(undefined);

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [...provideFirebaseMocks({ Auth, Firestore })] });
      const svc = TestBed.inject(User);
      await svc.ensureUserProfile();

      expect(setDoc).toHaveBeenCalledWith(
        'userDocRef',
        expect.objectContaining({ displayName: 'New User' }),
        { merge: true },
      );
    });
  });
});
