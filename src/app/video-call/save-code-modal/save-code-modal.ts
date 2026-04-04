import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PostService } from '../../services/postservice';
import { ScrollService } from '../../services/scroll.service';
import { EditorLanguage } from '../shared-editor/shared-editor.models';

@Component({
  selector: 'app-save-code-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './save-code-modal.html',
  styleUrl: './save-code-modal.css',
})
export class SaveCodeModalComponent {
  readonly code = input.required<string>();
  readonly language = input.required<EditorLanguage>();
  readonly dismiss = output<void>();

  private postService = inject(PostService);
  private router = inject(Router);
  private scrollService = inject(ScrollService);

  readonly caption = signal('');
  readonly sharing = signal(false);
  readonly error = signal('');

  async shareInFeed(): Promise<void> {
    this.sharing.set(true);
    this.error.set('');
    try {
      const postId = await this.postService.createCodePost(
        this.code(),
        this.language(),
        this.caption().trim(),
      );
      this.dismiss.emit();
      await this.router.navigateByUrl('/app-home/feed');
      setTimeout(() => {
        this.scrollService.refresh();
        this.scrollService.scrollToPost(postId);
      }, 300);
    } catch (err: any) {
      this.error.set(err?.message ?? 'Failed to share. Please try again.');
      this.sharing.set(false);
    }
  }

  onDismiss(): void {
    this.dismiss.emit();
  }
}
