import { Component, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { VideoCallService } from '../video-call.service';
import { SharedEditorService } from '../shared-editor/shared-editor.service';
import { SharedEditorComponent } from '../shared-editor/shared-editor';
import { SaveCodeModalComponent } from '../save-code-modal/save-code-modal';
import { EditorLanguage } from '../shared-editor/shared-editor.models';

import { VideoGridComponent, ControlBarComponent } from '@hiyve/angular';

@Component({
  selector: 'app-video-call-overlay',
  standalone: true,
  imports: [VideoGridComponent, ControlBarComponent, SharedEditorComponent, SaveCodeModalComponent],
  providers: [SharedEditorService],
  templateUrl: './video-call-overlay.html',
  styleUrl: './video-call-overlay.css',
})
export class VideoCallOverlayComponent {
  readonly videoCallService = inject(VideoCallService);
  readonly sharedEditorService = inject(SharedEditorService);
  private destroyRef = inject(DestroyRef);

  readonly hasConnected = signal(false);
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
    this.videoCallService.isInRoom$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((inRoom) => {
        if (inRoom) this.hasConnected.set(true);
      });

    toObservable(this.videoCallService.activeCall)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((call) => {
        if (call) {
          this.sharedEditorService.attach(call.id);
        } else {
          this.sharedEditorService.detach();
        }
      });
  }

  toggleEditor(): void {
    this.sharedEditorService.toggleEditor();
  }

  onLeaveCall(): void {
    const content = this.sharedEditorService.getDocumentContent();
    if (content.trim()) {
      this.savedCode.set(content);
      this.savedLanguage.set(this.sharedEditorService.language());
      this.showSaveModal.set(true);
      this.sharedEditorService.detach();
      this.videoCallService.endCall();
    } else {
      this.sharedEditorService.detach();
      this.videoCallService.endCall();
    }
  }

  dismissSaveModal(): void {
    this.showSaveModal.set(false);
    this.savedCode.set('');
  }
}
