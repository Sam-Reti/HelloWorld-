import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { signInWithEmailAndPassword, signOut, sendEmailVerification, sendPasswordResetEmail } from 'firebase/auth';
import { Router } from '@angular/router';
import { BackgroundImage } from '../background-image/background-image';
import { ExternalNav } from '../external-nav/external-nav';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, BackgroundImage, ExternalNav],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  email = '';
  password = '';
  message = '';
  showResetModal = false;
  resetEmail = '';
  resetError = '';

  constructor(
    private auth: Auth,
    private router: Router,
    private authService: AuthService,
  ) {}

  async login() {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, this.email, this.password);

      if (!userCredential.user.emailVerified) {
        await signOut(this.auth);
        this.message = 'Please verify your email before logging in.';
        return;
      }

      this.router.navigateByUrl('/app-home');
    } catch (error) {
      this.message = `Login failed: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  async signInWithGoogle() {
    try {
      await this.authService.signInWithGoogle();
      this.router.navigateByUrl('/app-home');
    } catch (error) {
      this.message = `Google sign-in failed: ${error instanceof Error ? error.message : String(error)}`;
    }
  }

  openResetModal() {
    this.resetEmail = '';
    this.resetError = '';
    this.showResetModal = true;
  }

  closeResetModal() {
    this.showResetModal = false;
  }

  submitReset() {
    this.resetError = '';
    const email = this.resetEmail.trim();
    if (!email) {
      this.resetError = 'Please enter your email address.';
      return;
    }
    sendPasswordResetEmail(this.auth, email, {
      url: `${window.location.origin}/reset-password`,
      handleCodeInApp: false,
    }).catch(() => {});
    this.showResetModal = false;
    this.message = `Reset link sent to ${email}. Check your inbox.`;
  }

  async resendVerification() {
    this.message = '';
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, this.email, this.password);
      await sendEmailVerification(userCredential.user);
      await signOut(this.auth);
      this.message = 'Verification email resent. Check your inbox.';
    } catch (error) {
      this.message = `Failed to resend: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
}
