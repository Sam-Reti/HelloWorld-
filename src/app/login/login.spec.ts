import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { LoginComponent } from './login';
import { provideFirebaseMocks, createMockRouter } from '../../testing/firebase-mocks';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockRouter: ReturnType<typeof createMockRouter>;
  let mockAuthService: { signInWithGoogle: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.resetAllMocks();
    // Restore default resolved values for async firebase/auth functions after clearAllMocks
    (sendPasswordResetEmail as any).mockResolvedValue(undefined);
    mockRouter = createMockRouter();
    mockAuthService = { signInWithGoogle: vi.fn().mockResolvedValue(undefined) };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        ...provideFirebaseMocks({ Auth, Firestore }),
        { provide: Router, useValue: mockRouter },
        { provide: AuthService, useValue: mockAuthService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(LoginComponent, { set: { template: '<div></div>' } })
      .compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('login()', () => {
    it('should navigate to /app-home on successful verified login', async () => {
      (signInWithEmailAndPassword as any).mockResolvedValue({
        user: { emailVerified: true },
      });
      component.email = 'test@example.com';
      component.password = 'password123';

      await component.login();

      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/app-home');
    });

    it('should show message for unverified email', async () => {
      (signInWithEmailAndPassword as any).mockResolvedValue({
        user: { emailVerified: false },
      });
      (signOut as any).mockResolvedValue(undefined);

      await component.login();

      expect(component.message).toContain('verify your email');
    });

    it('should show error on login failure', async () => {
      (signInWithEmailAndPassword as any).mockRejectedValue(new Error('Invalid credentials'));

      await component.login();

      expect(component.message).toContain('Login failed');
    });
  });

  describe('signInWithGoogle()', () => {
    it('should navigate to /app-home on success', async () => {
      await component.signInWithGoogle();
      expect(mockAuthService.signInWithGoogle).toHaveBeenCalled();
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/app-home');
    });

    it('should show error on failure', async () => {
      mockAuthService.signInWithGoogle.mockRejectedValue(new Error('popup closed'));
      await component.signInWithGoogle();
      expect(component.message).toContain('Google sign-in failed');
    });
  });

  describe('password reset modal', () => {
    it('openResetModal should show modal', () => {
      component.openResetModal();
      expect(component.showResetModal).toBe(true);
    });

    it('closeResetModal should hide modal', () => {
      component.showResetModal = true;
      component.closeResetModal();
      expect(component.showResetModal).toBe(false);
    });

    it('submitReset should show error for empty email', () => {
      component.showResetModal = true;
      component.resetEmail = '';
      component.submitReset();
      expect(component.resetError).toContain('enter your email');
    });

    it('submitReset should close modal and show message for valid email', () => {
      component.showResetModal = true;
      component.resetEmail = 'test@example.com';
      component.submitReset();
      expect(component.showResetModal).toBe(false);
      expect(component.message).toContain('Reset link sent');
    });
  });
});
