import { Component } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { signOut } from 'firebase/auth';
import { Router, RouterOutlet } from '@angular/router';
import { User } from '../services/user';
import { OnInit } from '@angular/core';
import { BackgroundImage } from '../background-image/background-image';
import { Feed } from '../feed/feed';

@Component({
  selector: 'app-app-home',
  standalone: true,
  imports: [RouterOutlet, BackgroundImage, Feed],
  templateUrl: './app-home.html',
  styleUrl: './app-home.css',
})
export class AppHome implements OnInit {
  constructor(
    private auth: Auth,
    private router: Router,
    private user: User,
  ) {}

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
}
