import { Component, inject } from '@angular/core';
import { VideoGridComponent, ControlBarComponent } from '@hiyve/angular';

import { CircleSessionService } from '../../services/circle-session.service';

@Component({
  selector: 'app-circle-session-overlay',
  standalone: true,
  imports: [VideoGridComponent, ControlBarComponent],
  templateUrl: './circle-session-overlay.html',
  styleUrl: './circle-session-overlay.css',
})
export class CircleSessionOverlayComponent {
  readonly sessionService = inject(CircleSessionService);

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

  onLeave(): void {
    this.sessionService.leaveSession();
  }
}
