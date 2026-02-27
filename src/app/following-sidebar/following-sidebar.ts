import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { combineLatest, map, Observable } from 'rxjs';
import { FollowService, PublicUser } from '../services/follow.service';
import { ChatService } from '../services/chat.service';
import { ChatPopupService } from '../services/chat-popup.service';

@Component({
  selector: 'app-following-sidebar',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './following-sidebar.html',
  styleUrl: './following-sidebar.css',
})
export class FollowingSidebar {
  private followService = inject(FollowService);
  private chatService = inject(ChatService);
  private chatPopupService = inject(ChatPopupService);

  // Combine the list of followed UIDs with full user profiles.
  // When either changes (new follow, profile update), the list updates automatically.
  following$: Observable<PublicUser[]> = combineLatest([
    this.followService.getFollowingIds$(),
    this.followService.getAllUsers$(),
  ]).pipe(
    map(([ids, users]) => users.filter((u) => ids.includes(u.uid))),
  );

  async openChat(user: PublicUser): Promise<void> {
    const id = await this.chatService.getOrCreateConversation(user.uid);
    this.chatPopupService.open({
      conversationId: id,
      name: user.displayName,
      color: user.avatarColor ?? null,
    });
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
}
