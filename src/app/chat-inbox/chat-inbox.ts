import { Component, inject } from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { Auth } from '@angular/fire/auth';
import { ChatService, Conversation } from '../services/chat.service';
import { ChatPopupService } from '../services/chat-popup.service';

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

  conversations$ = this.chatService.getConversations$();
  currentUid = this.auth.currentUser?.uid ?? '';

  otherUid(participantIds: string[]): string {
    return participantIds.find((id) => id !== this.currentUid) ?? '';
  }

  initials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  open(convo: Conversation): void {
    const other = this.otherUid(convo.participantIds);
    this.chatPopup.open({
      conversationId: convo.id,
      name: convo.participantNames?.[other] ?? 'Unknown',
      color: convo.participantColors?.[other] ?? null,
    });
  }
}
