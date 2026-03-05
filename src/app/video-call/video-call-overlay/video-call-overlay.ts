import { Component, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { VideoCallService } from '../video-call.service';

import { VideoGridComponent, ControlBarComponent } from '@hiyve/angular';

@Component({
  selector: 'app-video-call-overlay',
  standalone: true,
  imports: [VideoGridComponent, ControlBarComponent],
  templateUrl: './video-call-overlay.html',
  styleUrl: './video-call-overlay.css',
})
export class VideoCallOverlayComponent {
  readonly videoCallService = inject(VideoCallService);
  private destroyRef = inject(DestroyRef);

  /** True once the user has successfully joined the room — suppresses the connecting screen forever after. */
  readonly hasConnected = signal(false);

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
  }
}
