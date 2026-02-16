import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { Router } from '@angular/router';
import { BackgroundImage } from '../background-image/background-image';
import { ExternalNav } from '../external-nav/external-nav';

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
  message = '';

  constructor(
    private auth: Auth,
    private router: Router,
  ) {}

  async signup() {
    this.message = '';

    const email = this.email.trim();
    const password = this.password;
    const confirmPassword = this.confirmPassword;

    if (!email || !password || !confirmPassword) {
      this.message = 'Please fill in all fields.';
      return;
    }

    if (password !== confirmPassword) {
      this.message = 'Passwords do not match.';
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      this.message = `Account created for ${userCredential.user.email}`;
      this.router.navigateByUrl('/app-home');
    } catch (error) {
      this.message = `Signup failed: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
}
