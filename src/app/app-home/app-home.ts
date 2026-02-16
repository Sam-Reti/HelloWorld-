import { Component } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { signOut } from 'firebase/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-app-home',
  imports: [],
  templateUrl: './app-home.html',
  styleUrl: './app-home.css',
})
export class AppHome {
  constructor(
    private auth: Auth,
    private router: Router,
  ) {}
  async logout() {
    try {
      await signOut(this.auth);
      this.router.navigateByUrl('/login');
    } catch (err) {
      console.error('Logout failed', err);
    }
  }
}
