import { Component, OnInit } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { signOut } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

import { User } from '../services/user';
import { Feed } from '../feed/feed';
import { Profile } from '../profile/profile';
import { Editprofile } from '../editprofile/editprofile';

@Component({
  selector: 'app-app-home',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app-home.html',
  styleUrl: './app-home.css',
})
export class AppHome implements OnInit {
  userEmail: string | null = null;
  displayName: string | null = null;

  constructor(
    private auth: Auth,
    private router: Router,
    private user: User,
    private firestore: Firestore,
  ) {
    onAuthStateChanged(this.auth, async (user) => {
      if (!user) return;

      const userRef = doc(this.firestore, `users/${user.uid}`);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const data = snap.data() as any;
        this.displayName = data.displayName ?? null;
      }
    });
  }

  async logout() {
    try {
      await signOut(this.auth);
      this.router.navigateByUrl('/login');
    } catch (err) {
      console.error('Logout failed', err);
    }
  }

  getInitials(value: string | null | undefined): string {
    if (!value) return 'U';

    const parts = value.trim().split(' ');

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  async ngOnInit() {
    const ok = await this.user.ensureUserProfile();

    // don't redirect if you're already on edit-profile
    if (!ok && !this.router.url.includes('edit-profile')) {
      this.router.navigateByUrl('/app-home/edit-profile');
    }
  }
  editProfile() {
    this.router.navigateByUrl('/app-home/edit-profile');
  }

  goHome() {
    this.router.navigateByUrl('/app-home/feed');
  }

  goProfile() {
    this.router.navigateByUrl('/app-home/profile');
  }
}
