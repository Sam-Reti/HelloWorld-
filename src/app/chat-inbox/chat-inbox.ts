import { Component, inject } from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { Auth } from '@angular/fire/auth';
import { ChatService, Conversation } from '../services/chat.service';
import { ChatPopupService } from '../services/chat-popup.service';
import { FollowService } from '../services/follow.service';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'app-chat-inbox',
  standalone: true,
  imports: [AsyncPipe, DatePipe],
  templateUrl: './chat-inbox.html',
  styleUrl: './chat-inbox.css',
})
export class ChatInbox {
  private chatService = inject(ChatService);
  private chatPopup = inject(ChatPopupService);
  private auth = inject(Auth);
  private followService = inject(FollowService);

  conversations$ = this.chatService.getConversations$();
  currentUid = this.auth.currentUser?.uid ?? '';

  // Live map of uid → avatarColor
  private userColors$: Observable<Record<string, string>> = this.followService.getAllUsers$().pipe(
    map((users) => {
      const colors: Record<string, string> = {};
      for (const u of users) if (u.avatarColor) colors[u.uid] = u.avatarColor;
      return colors;
    }),
  );
  private userColorsSnapshot: Record<string, string> = {};

  constructor() {
    this.userColors$.subscribe((c) => (this.userColorsSnapshot = c));
  }

  otherUid(participantIds: string[]): string {
    return participantIds.find((id) => id !== this.currentUid) ?? '';
  }

  initials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  getColor(convo: Conversation): string {
    const other = this.otherUid(convo.participantIds);
    return this.userColorsSnapshot[other] || convo.participantColors?.[other] || '#0ea5a4';
  }

  open(convo: Conversation): void {
    const other = this.otherUid(convo.participantIds);
    this.chatPopup.open({
      conversationId: convo.id,
      name: convo.participantNames?.[other] ?? 'Unknown',
      color: this.userColorsSnapshot[other] || (convo.participantColors?.[other] ?? null),
    });
  }
}
