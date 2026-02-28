import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Auth } from '@angular/fire/auth';
import { Observable, combineLatest, map } from 'rxjs';
import { ChatService, Conversation } from '../services/chat.service';
import { ChatPopupService } from '../services/chat-popup.service';
import { FollowService, PublicUser } from '../services/follow.service';

@Component({
  selector: 'app-chat-sidebar',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './chat-sidebar.html',
  styleUrl: './chat-sidebar.css',
})
export class ChatSidebar {
  private chatService = inject(ChatService);
  private chatPopup = inject(ChatPopupService);
  private followService = inject(FollowService);
  private auth = inject(Auth);

  currentUid = this.auth.currentUser?.uid ?? '';

  conversations$: Observable<Conversation[]> = this.chatService.getConversations$();

  // For the "New Chat" picker
  newChatOpen = false;

  following$: Observable<PublicUser[]> = combineLatest([
    this.followService.getFollowingIds$(),
    this.followService.getAllUsers$(),
  ]).pipe(map(([ids, users]) => users.filter((u) => ids.includes(u.uid))));

  getOtherName(convo: Conversation): string {
    for (const [uid, name] of Object.entries(convo.participantNames)) {
      if (uid !== this.currentUid) return name;
    }
    return 'Unknown';
  }

  getOtherColor(convo: Conversation): string {
    for (const [uid, color] of Object.entries(convo.participantColors || {})) {
      if (uid !== this.currentUid) return color || '#22c55e';
    }
    return '#22c55e';
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  openConversation(convo: Conversation): void {
    const name = this.getOtherName(convo);
    const color = this.getOtherColor(convo);
    this.chatPopup.open({ conversationId: convo.id, name, color });
  }

  toggleNewChat(): void {
    this.newChatOpen = !this.newChatOpen;
  }

  async startChat(user: PublicUser): Promise<void> {
    this.newChatOpen = false;
    const id = await this.chatService.getOrCreateConversation(user.uid);
    this.chatPopup.open({
      conversationId: id,
      name: user.displayName,
      color: user.avatarColor ?? null,
    });
  }
}
