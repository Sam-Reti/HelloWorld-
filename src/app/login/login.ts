import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { signInWithEmailAndPassword } from 'firebase/auth';
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
      this.message = `Logged in as ${userCredential.user.email}`;
      this.router.navigateByUrl('/app-home');
    } catch (error) {
      this.message = `Login failed: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
}
