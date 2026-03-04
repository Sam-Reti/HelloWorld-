import { Component, Input } from '@angular/core';
import { Post } from '../services/postservice';
import { CodeEditorComponent } from '../practice/code-editor/code-editor';
import { PracticeLanguage } from '../practice/practice.models';

@Component({
  selector: 'app-code-post-card',
  standalone: true,
  imports: [CodeEditorComponent],
  templateUrl: './code-post-card.html',
  styleUrl: './code-post-card.css',
})
export class CodePostCardComponent {
  @Input({ required: true }) post!: Post;

  get language(): PracticeLanguage {
    return (this.post.codeLanguage as PracticeLanguage) ?? 'JavaScript';
  }
}
