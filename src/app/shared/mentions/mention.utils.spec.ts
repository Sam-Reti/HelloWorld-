import {
  extractMentionUids,
  insertMention,
  renderMentions,
  extractAndReplaceMentions,
  restoreMentionPlaceholders,
} from './mention.utils';

describe('mention.utils', () => {
  describe('extractMentionUids()', () => {
    it('should return empty array for text without mentions', () => {
      expect(extractMentionUids('Hello world')).toEqual([]);
    });

    it('should extract single mention uid', () => {
      expect(extractMentionUids('Hi @[Alice](uid-alice)!')).toEqual(['uid-alice']);
    });

    it('should extract multiple mention uids', () => {
      const text = 'Hey @[Alice](uid-alice) and @[Bob](uid-bob)!';
      expect(extractMentionUids(text)).toEqual(['uid-alice', 'uid-bob']);
    });

    it('should deduplicate UIDs', () => {
      const text = '@[Alice](uid-alice) check @[Alice](uid-alice)';
      expect(extractMentionUids(text)).toEqual(['uid-alice']);
    });
  });

  describe('insertMention()', () => {
    it('should replace @-trigger with mention token', () => {
      const result = insertMention('Hello @Al', 9, 6, 'Alice', 'uid-alice');
      expect(result.text).toBe('Hello @[Alice](uid-alice) ');
      expect(result.cursorPos).toBe('Hello @[Alice](uid-alice) '.length);
    });

    it('should handle insertion at the beginning', () => {
      const result = insertMention('@Bo', 3, 0, 'Bob', 'uid-bob');
      expect(result.text).toBe('@[Bob](uid-bob) ');
    });

    it('should preserve text after cursor', () => {
      const result = insertMention('Hi @Al world', 6, 3, 'Alice', 'uid-alice');
      expect(result.text).toBe('Hi @[Alice](uid-alice)  world');
    });
  });

  describe('renderMentions()', () => {
    it('should convert mention tokens to HTML links', () => {
      const result = renderMentions('Hi @[Alice](uid-alice)!');
      expect(result).toContain('href="/app-home/user/uid-alice"');
      expect(result).toContain('@Alice');
    });

    it('should handle multiple mentions', () => {
      const result = renderMentions('@[A](u1) and @[B](u2)');
      expect(result).toContain('href="/app-home/user/u1"');
      expect(result).toContain('href="/app-home/user/u2"');
    });

    it('should escape HTML in display names', () => {
      const result = renderMentions('@[<script>](uid)');
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });

    it('should leave plain text unchanged', () => {
      expect(renderMentions('Hello world')).toBe('Hello world');
    });
  });

  describe('extractAndReplaceMentions()', () => {
    it('should replace mentions with placeholders', () => {
      const result = extractAndReplaceMentions('Hi @[Alice](uid-alice)!');
      expect(result.text).toContain('MNTPH');
      expect(result.text).not.toContain('@[Alice]');
      expect(result.placeholders.size).toBe(1);
    });

    it('should handle text without mentions', () => {
      const result = extractAndReplaceMentions('Hello world');
      expect(result.text).toBe('Hello world');
      expect(result.placeholders.size).toBe(0);
    });

    it('should handle multiple mentions', () => {
      const result = extractAndReplaceMentions('@[A](u1) and @[B](u2)');
      expect(result.placeholders.size).toBe(2);
    });
  });

  describe('restoreMentionPlaceholders()', () => {
    it('should restore placeholders with HTML', () => {
      const { text, placeholders } = extractAndReplaceMentions('Hi @[Alice](uid-alice)!');
      const restored = restoreMentionPlaceholders(text, placeholders);
      expect(restored).toContain('href="/app-home/user/uid-alice"');
      expect(restored).toContain('@Alice');
    });

    it('should handle empty placeholders map', () => {
      expect(restoreMentionPlaceholders('Hello', new Map())).toBe('Hello');
    });
  });
});
