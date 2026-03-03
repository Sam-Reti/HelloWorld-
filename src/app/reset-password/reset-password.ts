import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { BackgroundImage } from '../background-image/background-image';
import { ExternalNav } from '../external-nav/external-nav';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, RouterLink, BackgroundImage, ExternalNav],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPasswordComponent implements OnInit {
  newPassword = '';
  confirmPassword = '';
  message = '';
  success = false;
  invalidLink = false;

  private oobCode = '';

  get passwordChecks() {
    const p = this.newPassword;
    return {
      length: p.length >= 8,
      upper: /[A-Z]/.test(p),
      lower: /[a-z]/.test(p),
      number: /[0-9]/.test(p),
    };
  }

  get passwordValid() {
    const c = this.passwordChecks;
    return c.length && c.upper && c.lower && c.number;
  }

  constructor(
    private auth: Auth,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  async ngOnInit() {
    const params = this.route.snapshot.queryParamMap;
    const mode = params.get('mode');
    const code = params.get('oobCode');

    if (mode !== 'resetPassword' || !code) {
      this.invalidLink = true;
      return;
    }

    this.oobCode = code;

    try {
      await verifyPasswordResetCode(this.auth, code);
    } catch {
      this.invalidLink = true;
    }
  }

  async submit() {
    this.message = '';

    if (!this.passwordValid) {
      this.message = 'Password does not meet the requirements below.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.message = 'Passwords do not match.';
      return;
    }

    try {
      await confirmPasswordReset(this.auth, this.oobCode, this.newPassword);
      this.success = true;
    } catch (error) {
      this.message = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
    }
  }
}
