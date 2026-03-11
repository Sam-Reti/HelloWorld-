import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ResetPasswordComponent } from './reset-password';
import { provideFirebaseMocks, createMockRouter, createMockActivatedRoute } from '../../testing/firebase-mocks';
import { Router, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';

describe('ResetPasswordComponent', () => {
  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let mockRouter: ReturnType<typeof createMockRouter>;

  beforeEach(async () => {
    vi.resetAllMocks();
    mockRouter = createMockRouter();

    await TestBed.configureTestingModule({
      imports: [ResetPasswordComponent],
      providers: [
        ...provideFirebaseMocks({ Auth, Firestore }),
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({ oobCode: 'valid-code' }),
            snapshot: { queryParams: { oobCode: 'valid-code' } },
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(ResetPasswordComponent, { set: { template: '<div></div>' } })
      .compileComponents();

    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('passwordChecks', () => {
    it('should validate length >= 8', () => {
      component.newPassword = 'Short1A';
      expect(component.passwordChecks.length).toBe(false);
      component.newPassword = 'LongEnough1';
      expect(component.passwordChecks.length).toBe(true);
    });

    it('should require uppercase', () => {
      component.newPassword = 'nouppercase1';
      expect(component.passwordChecks.upper).toBe(false);
    });

    it('should require lowercase', () => {
      component.newPassword = 'NOLOWERCASE1';
      expect(component.passwordChecks.lower).toBe(false);
    });

    it('should require number', () => {
      component.newPassword = 'NoNumberHere';
      expect(component.passwordChecks.number).toBe(false);
    });
  });

  describe('passwordValid', () => {
    it('should be true for valid password', () => {
      component.newPassword = 'ValidPass1';
      expect(component.passwordValid).toBe(true);
    });

    it('should be false for invalid password', () => {
      component.newPassword = 'weak';
      expect(component.passwordValid).toBe(false);
    });
  });

  describe('submit()', () => {
    it('should show error for invalid password', async () => {
      component.newPassword = 'weak';
      component.confirmPassword = 'weak';
      await component.submit();
      expect(component.message).toContain('requirements');
    });

    it('should show error for mismatched passwords', async () => {
      component.newPassword = 'ValidPass1';
      component.confirmPassword = 'DifferentPass1';
      await component.submit();
      expect(component.message).toContain('do not match');
    });

    it('should confirm reset on valid submission', async () => {
      (confirmPasswordReset as any).mockResolvedValue(undefined);
      component.newPassword = 'ValidPass1';
      component.confirmPassword = 'ValidPass1';
      (component as any).oobCode = 'valid-code';

      await component.submit();

      expect(confirmPasswordReset).toHaveBeenCalled();
      expect(component.success).toBe(true);
    });
  });
});
