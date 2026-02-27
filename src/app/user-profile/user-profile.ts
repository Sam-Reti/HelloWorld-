import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { startWith } from 'rxjs';
import { FollowService, PublicUser } from '../services/follow.service';
import { ChatService } from '../services/chat.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.css',
})
export class UserProfile implements OnInit {
  private route = inject(ActivatedRoute);
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private followService = inject(FollowService);
  private chatService = inject(ChatService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  profile: PublicUser | null = null;
  loading = true;
  isFollowing$!: Observable<boolean>;

  get isOwnProfile(): boolean {
    return this.auth.currentUser?.uid === this.profile?.uid;
  }

  async ngOnInit(): Promise<void> {
    const targetUid = this.route.snapshot.paramMap.get('uid');
    if (!targetUid) {
      this.loading = false;
      return;
    }

    this.isFollowing$ = this.followService.isFollowing$(targetUid).pipe(startWith(false));

    const snap = await getDoc(doc(this.firestore, `users/${targetUid}`));
    if (snap.exists()) {
      this.profile = { uid: targetUid, ...(snap.data() as Omit<PublicUser, 'uid'>) };
    }
    this.loading = false;
    this.cdr.detectChanges();
  }

  async toggle(isFollowing: boolean): Promise<void> {
    if (!this.profile) return;
    if (isFollowing) {
      await this.followService.unfollow(this.profile.uid);
    } else {
      await this.followService.follow(this.profile.uid);
    }
  }

  async message(): Promise<void> {
    if (!this.profile) return;
    const id = await this.chatService.getOrCreateConversation(this.profile.uid);
    this.router.navigate(['/app-home/messages', id]);
  }

  getInitials(value: string | null | undefined): string {
    if (!value) return 'U';
    const parts = value.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
}
