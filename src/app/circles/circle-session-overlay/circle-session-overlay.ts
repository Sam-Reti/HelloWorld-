import { Component, inject, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { VideoGridComponent, ControlBarComponent } from '@hiyve/angular';

import { CircleSessionService } from '../../services/circle-session.service';
import { SharedEditorService } from '../../video-call/shared-editor/shared-editor.service';
import { SharedEditorComponent } from '../../video-call/shared-editor/shared-editor';
import { SaveCodeModalComponent } from '../../video-call/save-code-modal/save-code-modal';
import { EditorLanguage } from '../../video-call/shared-editor/shared-editor.models';

@Component({
  selector: 'app-circle-session-overlay',
  standalone: true,
  imports: [VideoGridComponent, ControlBarComponent, SharedEditorComponent, SaveCodeModalComponent],
  providers: [SharedEditorService],
  templateUrl: './circle-session-overlay.html',
  styleUrl: './circle-session-overlay.css',
})
export class CircleSessionOverlayComponent {
  readonly sessionService = inject(CircleSessionService);
  readonly sharedEditorService = inject(SharedEditorService);
  private destroyRef = inject(DestroyRef);

  readonly showSaveModal = signal(false);
  readonly savedCode = signal('');
  readonly savedLanguage = signal<EditorLanguage>('JavaScript');

  readonly controlBarColors = {
    background: 'transparent',
    buttonDefault: 'rgba(255,255,255,0.1)',
    buttonHover: 'rgba(255,255,255,0.18)',
    buttonActive: 'rgba(239,68,68,0.3)',
    leaveButton: '#ef4444',
    leaveButtonHover: '#dc2626',
    iconDefault: '#ffffff',
    iconActive: '#fca5a5',
    divider: 'rgba(255,255,255,0.07)',
  };

  readonly controlBarStyles = {
    gap: '10px',
    padding: '12px 20px',
    buttonSize: 'large' as const,
    borderRadius: '14px',
    iconSize: '22px',
  };

  constructor() {
    toObservable(this.sessionService.activeSession)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((session) => {
        if (session?.id) {
          this.sharedEditorService.attach(session.id, 'circleSessions');
        } else {
          this.sharedEditorService.detach();
        }
      });
  }

  toggleEditor(): void {
    this.sharedEditorService.toggleEditor();
  }

  onLeave(): void {
    const content = this.sharedEditorService.getDocumentContent();
    if (content.trim()) {
      this.savedCode.set(content);
      this.savedLanguage.set(this.sharedEditorService.language());
      this.showSaveModal.set(true);
      this.sharedEditorService.detach();
      this.sessionService.leaveSession();
    } else {
      this.sharedEditorService.detach();
      this.sessionService.leaveSession();
    }
  }

  dismissSaveModal(): void {
    this.showSaveModal.set(false);
    this.savedCode.set('');
  }
}
