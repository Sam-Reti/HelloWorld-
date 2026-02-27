import { Injectable, signal } from '@angular/core';

export interface OpenChat {
  conversationId: string;
  name: string;
  color: string | null;
}

// A tiny service whose only job is to hold which chat popup is open.
// Using a signal so any component can react to changes without a subscription.
@Injectable({ providedIn: 'root' })
export class ChatPopupService {
  readonly openChat = signal<OpenChat | null>(null);

  open(chat: OpenChat): void {
    this.openChat.set(chat);
  }

  close(): void {
    this.openChat.set(null);
  }
}
