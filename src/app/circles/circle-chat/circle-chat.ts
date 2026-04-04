import {
  Component,
  Input,
  AfterViewChecked,
  ViewChild,
  ElementRef,
  inject,
} from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { Observable, Subscription } from 'rxjs';

import { CircleService } from '../../services/circle.service';
import { CircleChatMessage } from '../circle.models';

@Component({
  selector: 'app-circle-chat',
  standalone: true,
  imports: [AsyncPipe, FormsModule],
  templateUrl: './circle-chat.html',
  styleUrl: './circle-chat.css',
})
export class CircleChatComponent implements AfterViewChecked {
  @ViewChild('messageList') messageList?: ElementRef;
  @Input({ required: true }) circleId!: string;

  private circleService = inject(CircleService);
  private auth = inject(Auth);

  currentUid = this.auth.currentUser?.uid ?? '';
  text = '';
  messages$?: Observable<CircleChatMessage[]>;

  private shouldScroll = false;
  private sub?: Subscription;
  private initialized = false;

  ngOnChanges(): void {
    if (!this.circleId || this.initialized) return;
    this.initialized = true;
    this.sub?.unsubscribe();
    this.messages$ = this.circleService.getCircleMessages$(this.circleId);
    this.sub = this.messages$.subscribe(() => {
      this.shouldScroll = true;
    });
  }

  ngAfterViewChecked(): void {
    if (!this.shouldScroll) return;
    this.shouldScroll = false;
    const el = this.messageList?.nativeElement;
    if (el) {
      requestAnimationFrame(() => (el.scrollTop = el.scrollHeight));
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  async send(): Promise<void> {
    if (!this.text.trim()) return;
    const text = this.text;
    this.text = '';
    await this.circleService.sendCircleMessage(this.circleId, text);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
}
