import {
  ChangeDetectorRef,
  Component,
  OnInit,
  HostListener,
  ElementRef,
  ViewChild,
  inject,
} from '@angular/core';
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
import { Observable, Subject, of, combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';
import { AsyncPipe, SlicePipe } from '@angular/common';

import { User } from '../services/user';
import { SearchService, SearchResults } from '../services/search.service';
import { Feed } from '../feed/feed';
import { Profile } from '../profile/profile';
import { Editprofile } from '../editprofile/editprofile';
import { NgZone } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { map } from 'rxjs';
import { docData } from '@angular/fire/firestore';
import { authState } from '@angular/fire/auth';
import { NgIf } from '@angular/common';
import { ScrollService } from '../services/scroll.service';
import { ThemeService } from '../services/theme.service';
import { ChatPopup } from '../chat-popup/chat-popup';
import { ChatPopupService } from '../services/chat-popup.service';
import { ChatService } from '../services/chat.service';
import { PresenceService } from '../services/presence.service';
import { ChatSidebar } from '../chat-sidebar/chat-sidebar';

@Component({
  selector: 'app-app-home',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    AsyncPipe,
    NgIf,
    FormsModule,
    SlicePipe,
    ChatPopup,
    ChatSidebar,
  ],
  templateUrl: './app-home.html',
  styleUrl: './app-home.css',
})
export class AppHome implements OnInit {
  @ViewChild('notifContainer') notifContainer?: ElementRef;

  unreadCount$?: Observable<number>;
  userEmail: string | null = null;
  displayName: string | null = null;
  avatarColor: string | null = null;

  notifications$?: Observable<any[]>;
  unreadCount = 0;
  notifOpen = false;
  menuOpen = false;
  currentUid: string | null = null;

  // Search
  searchTerm = '';
  searchOpen = false;
  private searchSubject = new Subject<string>();
  searchResults$: Observable<SearchResults> = this.searchSubject.pipe(
    debounceTime(250),
    distinctUntilChanged(),
    switchMap((term) => this.searchService.search(term)),
  );

  constructor(
    private auth: Auth,
    private router: Router,
    private user: User,
    private firestore: Firestore,
    private scrollService: ScrollService,
    private themeService: ThemeService,
    private searchService: SearchService,
    private chatPopupService: ChatPopupService,
    private chatService: ChatService,
    private presenceService: PresenceService,
    private cdr: ChangeDetectorRef,
  ) {
    this.themeService.init();
    authState(this.auth).subscribe(async (user) => {
      if (!user) return;

      this.currentUid = user.uid;

      const userRef = doc(this.firestore, `users/${user.uid}`);
      const snap = await getDoc(userRef);
      const data = snap.exists() ? (snap.data() as any) : null;
      this.displayName = data?.displayName ?? null;
      this.avatarColor = data?.avatarColor ?? null;
      this.cdr.detectChanges();

      const notifCol = collection(this.firestore, `users/${user.uid}/notifications`);
      const notifQuery = query(notifCol, orderBy('createdAt', 'desc'));

      const rawNotifs$ = collectionData(notifQuery, { idField: 'id' });
      const openChat$ = toObservable(this.chatPopupService.openChat);

      this.notifications$ = combineLatest([rawNotifs$, openChat$]).pipe(
        map(([list, openChat]) =>
          list.filter(
            (n) =>
              !(
                n['type'] === 'message' &&
                openChat &&
                n['conversationId'] === openChat.conversationId
              ),
          ),
        ),
      );

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
    await this.user.ensureUserProfile();
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

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
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
  onSearchInput() {
    this.searchSubject.next(this.searchTerm);
    this.searchOpen = this.searchTerm.trim().length > 0;
  }

  clearSearch() {
    this.searchTerm = '';
    this.searchOpen = false;
  }

  goToUser(uid: string) {
    this.clearSearch();
    this.router.navigateByUrl(`/app-home/user/${uid}`);
  }

  goToPost(postId: string) {
    this.clearSearch();
    this.router.navigateByUrl('/app-home/feed').then(() => {
      this.scrollService.scrollToPost(postId);
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.notifContainer && !this.notifContainer.nativeElement.contains(event.target)) {
      this.notifOpen = false;
    }
    // Close search dropdown when clicking outside
    const searchEl = document.querySelector('.search');
    if (searchEl && !searchEl.contains(event.target as Node)) {
      this.searchOpen = false;
    }
  }

  async onNotificationClick(notification: any) {
    this.notifOpen = false;

    if (notification.type === 'follow' && notification.actorId) {
      await this.router.navigateByUrl(`/app-home/user/${notification.actorId}`);
      return;
    }

    if (notification.type === 'message' && notification.conversationId) {
      this.chatPopupService.open({
        conversationId: notification.conversationId,
        name: notification.actorName || 'Unknown',
        color: null,
      });
      return;
    }

    await this.router.navigateByUrl('/app-home/feed');
    if (notification.postId) {
      this.scrollService.scrollToPost(notification.postId);
    }
  }
}
