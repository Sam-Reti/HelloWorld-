import { Component, inject } from '@angular/core';
import { VideoCallService } from '../video-call.service';

// TODO: uncomment once @hiyve/* packages are installed
// import { VideoGridComponent, ControlBarComponent } from '@hiyve/angular';

@Component({
  selector: 'app-video-call-overlay',
  standalone: true,
  imports: [
    // TODO: VideoGridComponent, ControlBarComponent,
  ],
  templateUrl: './video-call-overlay.html',
  styleUrl: './video-call-overlay.css',
})
export class VideoCallOverlayComponent {
  readonly videoCallService = inject(VideoCallService);
}
