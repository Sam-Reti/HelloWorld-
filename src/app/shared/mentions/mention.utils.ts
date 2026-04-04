/** Mention token format: @[DisplayName](uid) */
const MENTION_RE = /@\[([^\]]+)\]\(([^)]+)\)/g;

export function extractMentionUids(text: string): string[] {
  const uids: string[] = [];
  let match: RegExpExecArray | null;
  const re = new RegExp(MENTION_RE.source, 'g');
  while ((match = re.exec(text))) uids.push(match[2]);
  return [...new Set(uids)];
}

export function insertMention(
  text: string,
  cursorPos: number,
  atSignPos: number,
  displayName: string,
  uid: string,
): { text: string; cursorPos: number } {
  const token = `@[${displayName}](${uid}) `;
  const before = text.slice(0, atSignPos);
  const after = text.slice(cursorPos);
  return { text: before + token + after, cursorPos: before.length + token.length };
}

export function renderMentions(text: string): string {
  return text.replace(
    MENTION_RE,
    (_, name, uid) =>
      `<a class="mention" href="/app-home/user/${uid}">@${escapeHtml(name)}</a>`,
  );
}

/**
 * Swap mention tokens for unique placeholders before markdown/sanitize,
 * so they survive the transformation pipeline.
 */
export function extractAndReplaceMentions(text: string): {
  text: string;
  placeholders: Map<string, string>;
} {
  const placeholders = new Map<string, string>();
  let i = 0;
  const replaced = text.replace(MENTION_RE, (original, name, uid) => {
    const key = `MNTPH${i++}MNTPH`;
    placeholders.set(
      key,
      `<a class="mention" href="/app-home/user/${uid}">@${escapeHtml(name)}</a>`,
    );
    return key;
  });
  return { text: replaced, placeholders };
}

export function restoreMentionPlaceholders(
  html: string,
  placeholders: Map<string, string>,
): string {
  let result = html;
  for (const [key, value] of placeholders) {
    result = result.replace(key, value);
  }
  return result;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
