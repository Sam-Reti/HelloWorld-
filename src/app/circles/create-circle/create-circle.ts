import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { CircleService } from '../../services/circle.service';
import { CircleVisibility } from '../circle.models';

@Component({
  selector: 'app-create-circle',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './create-circle.html',
  styleUrl: './create-circle.css',
})
export class CreateCircleComponent {
  private circleService = inject(CircleService);
  private router = inject(Router);

  name = '';
  description = '';
  visibility: CircleVisibility = 'public';
  bannerFile: File | null = null;
  bannerPreview: string | null = null;
  submitting = false;

  onBannerSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.bannerFile = file;
    this.bannerPreview = URL.createObjectURL(file);
  }

  removeBanner(): void {
    this.bannerFile = null;
    this.bannerPreview = null;
  }

  async submit(): Promise<void> {
    if (!this.name.trim() || this.submitting) return;
    this.submitting = true;

    try {
      const id = await this.circleService.createCircle(
        this.name,
        this.description,
        this.visibility,
        this.bannerFile,
      );
      this.router.navigateByUrl(`/app-home/circles/${id}`);
    } finally {
      this.submitting = false;
    }
  }
}
