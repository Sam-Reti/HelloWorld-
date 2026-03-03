import { Component, inject } from '@angular/core';
import { VideoCallService } from '../video-call.service';

@Component({
  selector: 'app-incoming-call-banner',
  standalone: true,
  templateUrl: './incoming-call-banner.html',
  styleUrl: './incoming-call-banner.css',
})
export class IncomingCallBannerComponent {
  readonly videoCallService = inject(VideoCallService);
}
