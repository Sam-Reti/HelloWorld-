import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { applyActionCode } from 'firebase/auth';
import { BackgroundImage } from '../background-image/background-image';
import { ExternalNav } from '../external-nav/external-nav';

type VerifyState = 'pending' | 'success' | 'error';

@Component({
  selector: 'app-verify-email',
  imports: [RouterLink, BackgroundImage, ExternalNav],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.css',
})
export class VerifyEmailComponent implements OnInit {
  state: VerifyState = 'pending';
  message = '';
  private oobCode = '';

  constructor(
    private route: ActivatedRoute,
    private auth: Auth,
  ) {}

  ngOnInit() {
    this.oobCode = this.route.snapshot.queryParamMap.get('oobCode') ?? '';
    if (!this.oobCode) {
      this.state = 'error';
      this.message = 'Invalid verification link.';
    }
  }

  async verify() {
    try {
      await applyActionCode(this.auth, this.oobCode);
      this.state = 'success';
    } catch {
      this.state = 'error';
      this.message = 'Verification failed. The link may have expired — request a new one from the login page.';
    }
  }
}
