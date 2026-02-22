import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { Router } from '@angular/router';
import { BackgroundImage } from '../background-image/background-image';
import { ExternalNav } from '../external-nav/external-nav';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-signup',
  imports: [FormsModule, BackgroundImage, ExternalNav],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class SignupComponent {
  email = '';
  password = '';
  confirmPassword = '';
  displayName = '';
  message = '';

  constructor(
    private auth: Auth,
    private router: Router,
    private firestore: Firestore,
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
        createdAt: new Date(),
      });

      this.router.navigateByUrl('/app-home');
    } catch (error) {
      this.message = `Signup failed: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
}
