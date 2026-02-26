import { Component, OnInit, HostListener, ElementRef, ViewChild, inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { signOut } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import {
  Firestore,
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  updateDoc,
} from '@angular/fire/firestore';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';

import { User } from '../services/user';
import { Feed } from '../feed/feed';
import { Profile } from '../profile/profile';
import { Editprofile } from '../editprofile/editprofile';
import { NgZone } from '@angular/core';
import { map } from 'rxjs';
import { docData } from '@angular/fire/firestore';
import { authState } from '@angular/fire/auth';
import { NgIf } from '@angular/common';
import { ScrollService } from '../services/scroll.service';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-app-home',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AsyncPipe, NgIf],
  templateUrl: './app-home.html',
  styleUrl: './app-home.css',
})
export class AppHome implements OnInit {
  @ViewChild('notifContainer') notifContainer?: ElementRef;

  unreadCount$?: Observable<number>;
  userEmail: string | null = null;
  displayName: string | null = null;

  notifications$?: Observable<any[]>;
  unreadCount = 0;
  notifOpen = false;
  currentUid: string | null = null;

  constructor(
    private auth: Auth,
    private router: Router,
    private user: User,
    private firestore: Firestore,
    private scrollService: ScrollService,
    private themeService: ThemeService,
  ) {
    this.themeService.init();
    authState(this.auth).subscribe(async (user) => {
      if (!user) return;

      this.currentUid = user.uid;

      const userRef = doc(this.firestore, `users/${user.uid}`);
      const snap = await getDoc(userRef);
      this.displayName = snap.exists() ? ((snap.data() as any).displayName ?? null) : null;

      const notifCol = collection(this.firestore, `users/${user.uid}/notifications`);
      const notifQuery = query(notifCol, orderBy('createdAt', 'desc'));

      this.notifications$ = collectionData(notifQuery, { idField: 'id' });

      this.unreadCount$ = this.notifications$.pipe(
        map((list) => list.filter((n) => !n.read).length),
      );
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
  toggleNotifications() {
    this.notifOpen = !this.notifOpen;

    // mark read when opening
    if (this.notifOpen) {
      this.markAllRead();
    }
  }

  async markAllRead() {
    if (!this.currentUid || !this.notifications$) return;

    // take one snapshot of current list
    const sub = this.notifications$.subscribe(async (list) => {
      sub.unsubscribe();

      const unread = list.filter((n) => !n.read);
      for (const n of unread) {
        const ref = doc(this.firestore, `users/${this.currentUid}/notifications/${n.id}`);
        await updateDoc(ref, { read: true }).catch(() => {});
      }
    });
  }
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.notifContainer && !this.notifContainer.nativeElement.contains(event.target)) {
      this.notifOpen = false;
    }
  }

  async onNotificationClick(notification: any) {
    // Close the notification panel
    this.notifOpen = false;

    // Navigate to feed
    await this.router.navigateByUrl('/app-home/feed');

    // Signal the feed to scroll to this post
    if (notification.postId) {
      this.scrollService.scrollToPost(notification.postId);
    }
  }
}
