import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { provideFirebaseMocks, FAKE_USER } from '../../testing/firebase-mocks';

import { Auth, authState } from '@angular/fire/auth';
import { signInWithPopup } from 'firebase/auth';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    vi.resetAllMocks();
    (authState as any).mockReturnValue(of(FAKE_USER));
    (doc as any).mockReturnValue('userDocRef');

    TestBed.configureTestingModule({
      providers: [...provideFirebaseMocks({ Auth, Firestore })],
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('user$', () => {
    it('should emit the current auth state', async () => {
      const user = await firstValueFrom(service.user$);
      expect(user).toEqual(FAKE_USER);
    });

    it('should emit null when logged out', async () => {
      (authState as any).mockReturnValue(of(null));
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [...provideFirebaseMocks({ Auth, Firestore })] });
      const svc = TestBed.inject(AuthService);
      const user = await firstValueFrom(svc.user$);
      expect(user).toBeNull();
    });
  });

  describe('signInWithGoogle()', () => {
    it('should create Firestore doc if user is new', async () => {
      const fakeCredential = { user: { uid: 'new-uid', displayName: 'New', email: 'new@test.com' } };
      (signInWithPopup as any).mockResolvedValue(fakeCredential);
      (getDoc as any).mockResolvedValue({ exists: () => false });
      (setDoc as any).mockResolvedValue(undefined);

      await service.signInWithGoogle();

      expect(signInWithPopup).toHaveBeenCalled();
      expect(setDoc).toHaveBeenCalledWith('userDocRef', expect.objectContaining({
        displayName: 'New',
        bio: '',
        email: 'new@test.com',
      }));
    });

    it('should skip Firestore doc creation if user already exists', async () => {
      const fakeCredential = { user: { uid: 'existing', displayName: 'Old', email: 'old@test.com' } };
      (signInWithPopup as any).mockResolvedValue(fakeCredential);
      (getDoc as any).mockResolvedValue({ exists: () => true });

      await service.signInWithGoogle();

      expect(setDoc).not.toHaveBeenCalled();
    });

    it('should throw friendly error for account-exists-with-different-credential', async () => {
      const authError = { code: 'auth/account-exists-with-different-credential', message: 'err' };
      (signInWithPopup as any).mockRejectedValue(authError);

      await expect(service.signInWithGoogle()).rejects.toThrow(
        'An account with this email already exists',
      );
    });
  });
});
