import { Pipe, PipeTransform } from '@angular/core';
import { renderMentions } from '../shared/mentions/mention.utils';

@Pipe({ name: 'mention', standalone: true, pure: true })
export class MentionPipe implements PipeTransform {
  transform(text: string): string {
    if (!text) return '';
    // Escape HTML first (comments are plain text), then render mentions
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return renderMentions(escaped);
  }
}
