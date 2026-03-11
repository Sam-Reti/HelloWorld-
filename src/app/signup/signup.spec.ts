import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SignupComponent } from './signup';
import { provideFirebaseMocks, createMockRouter } from '../../testing/firebase-mocks';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

import { Auth } from '@angular/fire/auth';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification, signOut } from 'firebase/auth';
import { Firestore, setDoc } from '@angular/fire/firestore';

describe('SignupComponent', () => {
  let component: SignupComponent;
  let fixture: ComponentFixture<SignupComponent>;
  let mockRouter: ReturnType<typeof createMockRouter>;

  beforeEach(async () => {
    vi.resetAllMocks();
    mockRouter = createMockRouter();

    await TestBed.configureTestingModule({
      imports: [SignupComponent],
      providers: [
        ...provideFirebaseMocks({ Auth, Firestore }),
        { provide: Router, useValue: mockRouter },
        { provide: AuthService, useValue: { signInWithGoogle: vi.fn().mockResolvedValue(undefined) } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(SignupComponent, { set: { template: '<div></div>' } })
      .compileComponents();

    fixture = TestBed.createComponent(SignupComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('passwordChecks', () => {
    it('should require 8+ chars', () => {
      component.password = 'Short1A';
      expect(component.passwordChecks.length).toBe(false);
    });

    it('should require uppercase', () => {
      component.password = 'lowercase1';
      expect(component.passwordChecks.upper).toBe(false);
    });

    it('should require lowercase', () => {
      component.password = 'UPPERCASE1';
      expect(component.passwordChecks.lower).toBe(false);
    });

    it('should require number', () => {
      component.password = 'NoNumbersHere';
      expect(component.passwordChecks.number).toBe(false);
    });

    it('should pass all checks for valid password', () => {
      component.password = 'ValidPass1';
      const checks = component.passwordChecks;
      expect(checks.length).toBe(true);
      expect(checks.upper).toBe(true);
      expect(checks.lower).toBe(true);
      expect(checks.number).toBe(true);
    });
  });

  describe('passwordValid', () => {
    it('should be true when all checks pass', () => {
      component.password = 'ValidPass1';
      expect(component.passwordValid).toBe(true);
    });

    it('should be false when any check fails', () => {
      component.password = 'short';
      expect(component.passwordValid).toBe(false);
    });
  });

  describe('signup()', () => {
    it('should show error for empty fields', async () => {
      component.email = '';
      component.password = '';
      component.confirmPassword = '';
      component.displayName = '';
      await component.signup();
      expect(component.message).toContain('fill in all fields');
    });

    it('should show error for invalid password', async () => {
      component.email = 'test@example.com';
      component.displayName = 'Test';
      component.password = 'weak';
      component.confirmPassword = 'weak';
      await component.signup();
      expect(component.message).toContain('requirements');
    });

    it('should show error for mismatched passwords', async () => {
      component.email = 'test@example.com';
      component.displayName = 'Test';
      component.password = 'ValidPass1';
      component.confirmPassword = 'DifferentPass1';
      await component.signup();
      expect(component.message).toContain('do not match');
    });

    it('should create user on valid signup', async () => {
      (createUserWithEmailAndPassword as any).mockResolvedValue({
        user: { uid: 'new-uid', email: 'test@test.com' },
      });
      (updateProfile as any).mockResolvedValue(undefined);
      (setDoc as any).mockResolvedValue(undefined);
      (sendEmailVerification as any).mockResolvedValue(undefined);
      (signOut as any).mockResolvedValue(undefined);

      component.email = 'test@test.com';
      component.displayName = 'New User';
      component.password = 'ValidPass1';
      component.confirmPassword = 'ValidPass1';

      await component.signup();

      expect(createUserWithEmailAndPassword).toHaveBeenCalled();
      expect(component.emailSent).toBe(true);
    });
  });
});
