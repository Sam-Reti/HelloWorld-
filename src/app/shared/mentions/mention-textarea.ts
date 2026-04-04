import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  OnDestroy,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PublicUser } from '../../services/follow.service';
import { insertMention, extractMentionUids } from './mention.utils';

@Component({
  selector: 'app-mention-textarea',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mention-textarea.html',
  styleUrl: './mention-textarea.css',
})
export class MentionTextareaComponent implements OnDestroy {
  @Input() users: PublicUser[] = [];
  @Input() placeholder = '';
  @Input() value = '';
  @Input() rows = 4;
  @Input() variant: 'textarea' | 'input' = 'textarea';

  @Output() valueChange = new EventEmitter<string>();
  @Output() mentionedUids = new EventEmitter<string[]>();
  @Output() submitRequest = new EventEmitter<void>();

  @ViewChild('inputEl') inputEl?: ElementRef<HTMLTextAreaElement | HTMLInputElement>;

  private cdr = inject(ChangeDetectorRef);

  filteredUsers: PublicUser[] = [];
  showDropdown = false;
  activeIndex = 0;
  dropdownStyle: Record<string, string> = {};
  private atSignPos = -1;
  private lastInputEl: HTMLTextAreaElement | HTMLInputElement | null = null;
  private scrollHandler = () => this.updateDropdownPosition();

  ngOnDestroy() {
    window.removeEventListener('scroll', this.scrollHandler, true);
  }

  onInput(event: Event) {
    const el = event.target as HTMLTextAreaElement | HTMLInputElement;
    this.lastInputEl = el;
    this.value = el.value;
    this.valueChange.emit(this.value);
    this.checkForMention(el);
  }

  onKeydown(event: KeyboardEvent) {
    if (this.showDropdown) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.activeIndex = Math.min(this.activeIndex + 1, this.filteredUsers.length - 1);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.activeIndex = Math.max(this.activeIndex - 1, 0);
        return;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        if (this.filteredUsers.length > 0) {
          event.preventDefault();
          this.selectUser(this.filteredUsers[this.activeIndex]);
          return;
        }
      }
      if (event.key === 'Escape') {
        this.closeDropdown();
        return;
      }
    }

    if (event.key === 'Enter' && this.variant === 'input' && !this.showDropdown) {
      event.preventDefault();
      this.submitRequest.emit();
    }
  }

  selectUser(user: PublicUser) {
    const el = this.lastInputEl ?? this.inputEl?.nativeElement;
    if (!el) return;

    const cursorPos = el.selectionStart ?? this.value.length;
    const result = insertMention(this.value, cursorPos, this.atSignPos, user.displayName, user.uid);

    this.value = result.text;
    this.valueChange.emit(this.value);
    this.mentionedUids.emit(extractMentionUids(this.value));
    this.closeDropdown();

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(result.cursorPos, result.cursorPos);
    });
  }

  onBlur() {
    // Delay so mousedown on dropdown fires first
    setTimeout(() => this.closeDropdown(), 150);
  }

  private checkForMention(el: HTMLTextAreaElement | HTMLInputElement) {
    const cursor = el.selectionStart ?? 0;
    const textBefore = this.value.slice(0, cursor);

    const lastAt = textBefore.lastIndexOf('@');
    if (lastAt === -1) {
      this.closeDropdown();
      return;
    }

    // Skip completed mention tokens
    const afterAt = this.value.slice(lastAt);
    if (/^@\[[^\]]+\]\([^)]+\)/.test(afterAt)) {
      this.closeDropdown();
      return;
    }

    // '@' must be at start or preceded by whitespace
    if (lastAt > 0 && !/\s/.test(textBefore[lastAt - 1])) {
      this.closeDropdown();
      return;
    }

    const prefix = textBefore.slice(lastAt + 1).toLowerCase();
    if (prefix.includes(' ') && prefix.length > 20) {
      this.closeDropdown();
      return;
    }

    this.atSignPos = lastAt;
    this.filteredUsers = this.users
      .filter((u) => u.displayName?.toLowerCase().includes(prefix))
      .slice(0, 8);

    if (this.filteredUsers.length === 0) {
      this.closeDropdown();
      return;
    }

    this.activeIndex = 0;
    this.showDropdown = true;
    this.updateDropdownPosition();
    window.addEventListener('scroll', this.scrollHandler, true);
    this.cdr.detectChanges();
  }

  closeDropdown() {
    if (!this.showDropdown) return;
    this.showDropdown = false;
    this.filteredUsers = [];
    this.activeIndex = 0;
    window.removeEventListener('scroll', this.scrollHandler, true);
    this.cdr.detectChanges();
  }

  private updateDropdownPosition() {
    const el = this.lastInputEl ?? this.inputEl?.nativeElement;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    this.dropdownStyle = {
      position: 'fixed',
      left: rect.left + 'px',
      width: rect.width + 'px',
      top: rect.bottom + 4 + 'px',
      'max-height': '240px',
    };
  }
}
