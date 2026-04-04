import { Pipe, PipeTransform } from '@angular/core';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import {
  extractAndReplaceMentions,
  restoreMentionPlaceholders,
} from '../shared/mentions/mention.utils';

@Pipe({ name: 'markdown', standalone: true, pure: true })
export class MarkdownPipe implements PipeTransform {
  private cache = new Map<string, string>();

  transform(text: string): string {
    if (!text) return '';
    if (this.cache.has(text)) return this.cache.get(text)!;

    // 1) Extract mentions before markdown/sanitize
    const { text: stripped, placeholders } = extractAndReplaceMentions(text);

    // 2) Markdown + sanitize
    const html = DOMPurify.sanitize(marked.parse(stripped) as string);

    // 3) Restore mention HTML
    const result = restoreMentionPlaceholders(html, placeholders);
    this.cache.set(text, result);
    return result;
  }
}
