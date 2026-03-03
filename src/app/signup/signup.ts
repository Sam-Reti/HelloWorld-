import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  signOut,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { BackgroundImage } from '../background-image/background-image';
import { ExternalNav } from '../external-nav/external-nav';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-signup',
  imports: [FormsModule, RouterLink, BackgroundImage, ExternalNav],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class SignupComponent {
  email = '';
  password = '';
  confirmPassword = '';
  displayName = '';
  message = '';
  emailSent = false;

  get passwordChecks() {
    const p = this.password;
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
    private firestore: Firestore,
    private authService: AuthService,
    private router: Router,
  ) {}

  async signup() {
    this.message = '';

    const email = this.email.trim();
    const displayName = this.displayName.trim();
    const password = this.password;
    const confirmPassword = this.confirmPassword;

    if (!email || !displayName || !password || !confirmPassword) {
      this.message = 'Please fill in all fields.';
      return;
    }

    if (!this.passwordValid) {
      this.message = 'Password does not meet the requirements below.';
      return;
    }

    if (password !== confirmPassword) {
      this.message = 'Passwords do not match.';
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);

      await updateProfile(userCredential.user, { displayName });

      const uid = userCredential.user.uid;
      await setDoc(doc(this.firestore, `users/${uid}`), {
        displayName,
        bio: '',
        email,
        avatarColor: '#0ea5a4',
        followerCount: 0,
        followingCount: 0,
        createdAt: new Date(),
      });

      await sendEmailVerification(userCredential.user);
      await signOut(this.auth);

      this.emailSent = true;
    } catch (error) {
      this.message = `Signup failed: ${error instanceof Error ? error.message : String(error)}`;
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
