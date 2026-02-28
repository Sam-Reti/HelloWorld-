import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { combineLatest, map, Observable } from 'rxjs';
import { FollowService, PublicUser } from '../services/follow.service';
import { ChatService } from '../services/chat.service';
import { ChatPopupService } from '../services/chat-popup.service';

@Component({
  selector: 'app-following',
  standalone: true,
  imports: [AsyncPipe, RouterLink],
  templateUrl: './following.html',
  styleUrl: './following.css',
})
export class Following {
  private followService = inject(FollowService);
  private chatService = inject(ChatService);
  private chatPopupService = inject(ChatPopupService);
  private auth = inject(Auth);

  currentUid = this.auth.currentUser?.uid ?? null;

  following$: Observable<PublicUser[]> = combineLatest([
    this.followService.getFollowingIds$(),
    this.followService.getAllUsers$(),
  ]).pipe(map(([ids, users]) => users.filter((u) => ids.includes(u.uid))));

  getInitials(value: string | null | undefined): string {
    if (!value) return 'U';
    const parts = value.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  async unfollow(uid: string): Promise<void> {
    try {
      await this.followService.unfollow(uid);
    } catch (e) {
      console.error('Unfollow failed', e);
    }
  }

  async openChat(user: PublicUser): Promise<void> {
    const id = await this.chatService.getOrCreateConversation(user.uid);
    this.chatPopupService.open({
      conversationId: id,
      name: user.displayName,
      color: user.avatarColor ?? null,
    });
  }
}
