import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { signInWithEmailAndPassword, signOut, sendEmailVerification } from 'firebase/auth';
import { Router } from '@angular/router';
import { BackgroundImage } from '../background-image/background-image';
import { ExternalNav } from '../external-nav/external-nav';

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

  constructor(
    private auth: Auth,
    private router: Router,
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
