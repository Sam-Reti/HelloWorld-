import { Component, OnInit } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { signOut } from 'firebase/auth';
import { Router, RouterOutlet } from '@angular/router';
import { onAuthStateChanged } from 'firebase/auth';

import { User } from '../services/user';
import { Feed } from '../feed/feed';

@Component({
  selector: 'app-app-home',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app-home.html',
  styleUrl: './app-home.css',
})
export class AppHome implements OnInit {
  userEmail: string | null = null;

  constructor(
    private auth: Auth,
    private router: Router,
    private user: User,
  ) {
    onAuthStateChanged(this.auth, (user) => {
      this.userEmail = user?.email ?? null;
    });
  }

  async ngOnInit() {
    await this.user.ensureUserProfile();
  }

  async logout() {
    try {
      await signOut(this.auth);
      this.router.navigateByUrl('/login');
    } catch (err) {
      console.error('Logout failed', err);
    }
  }

  getInitials(email: string | null | undefined): string {
    if (!email) return 'U';
    return email.split('@')[0].slice(0, 2).toUpperCase();
  }
}
