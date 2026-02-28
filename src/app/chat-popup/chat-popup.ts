import {
  Component,
  OnDestroy,
  AfterViewChecked,
  ViewChild,
  ElementRef,
  inject,
  effect,
} from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { Observable, Subscription } from 'rxjs';
import { ChatService, Message, Conversation } from '../services/chat.service';
import { ChatPopupService } from '../services/chat-popup.service';
import { PresenceService } from '../services/presence.service';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-chat-popup',
  standalone: true,
  imports: [AsyncPipe, FormsModule],
  templateUrl: './chat-popup.html',
  styleUrl: './chat-popup.css',
})
export class ChatPopup implements AfterViewChecked, OnDestroy {
  @ViewChild('messageList') messageList?: ElementRef;

  private chatService = inject(ChatService);
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private presenceService = inject(PresenceService);
  readonly popup = inject(ChatPopupService);

  currentUid = this.auth.currentUser?.uid ?? '';
  otherOnline = false;
  text = '';
  messages$?: Observable<Message[]>;

  private shouldScroll = false;
  private presenceSub?: Subscription;
  private sub?: Subscription;
  private activeConvoId = '';

  constructor() {
    // effect() runs whenever the signal value changes.
    // When the user opens a different chat, we swap the messages$ stream.
    effect(() => {
      const chat = this.popup.openChat();
      if (!chat || chat.conversationId === this.activeConvoId) return;
      this.activeConvoId = chat.conversationId;
      this.sub?.unsubscribe();
      this.messages$ = this.chatService.getMessages$(chat.conversationId);
      this.sub = this.messages$.subscribe(() => {
        this.shouldScroll = true;
      });
      // Mark this conversation as read for the current user
      this.chatService.markRead(chat.conversationId);

      // Track online status of the other participant
      this.presenceSub?.unsubscribe();
      this.resolveOtherOnline(chat.conversationId);
    });
  }

  private async resolveOtherOnline(convoId: string): Promise<void> {
    const convoRef = doc(this.firestore, `conversations/${convoId}`);
    const snap = await getDoc(convoRef);
    const data = snap.data() as Conversation | undefined;
    const otherUid = data?.participantIds?.find((id) => id !== this.currentUid) ?? '';
    if (!otherUid) return;
    this.presenceSub = this.presenceService.onlineUsers$.subscribe((online) => {
      this.otherOnline = online.has(otherUid);
    });
  }

  ngAfterViewChecked(): void {
    if (!this.shouldScroll) return;
    this.shouldScroll = false;
    const el = this.messageList?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.presenceSub?.unsubscribe();
  }

  async send(): Promise<void> {
    const chat = this.popup.openChat();
    if (!chat || !this.text.trim()) return;
    const text = this.text;
    this.text = '';
    await this.chatService.sendMessage(chat.conversationId, text);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  close(): void {
    // Mark conversation as read before closing
    if (this.activeConvoId) {
      this.chatService.markRead(this.activeConvoId);
    }
    this.sub?.unsubscribe();
    this.presenceSub?.unsubscribe();
    this.messages$ = undefined;
    this.activeConvoId = '';
    this.otherOnline = false;
    this.popup.close();
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
}
