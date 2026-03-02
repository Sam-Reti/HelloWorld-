import { Pipe, PipeTransform } from '@angular/core';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

@Pipe({ name: 'markdown', standalone: true, pure: true })
export class MarkdownPipe implements PipeTransform {
  private cache = new Map<string, string>();

  transform(text: string): string {
    if (!text) return '';
    if (this.cache.has(text)) return this.cache.get(text)!;
    const html = DOMPurify.sanitize(marked.parse(text) as string);
    this.cache.set(text, html);
    return html;
  }
}
