/** The most keywords one Add can take. */
export const MAX_KEYWORDS = 200;
export const MAX_KEYWORD_LENGTH = 200;
export const MAX_TAGS = 10;
export const MAX_TAG_LENGTH = 30;

export interface ParsedKeywords {
  /** Unique keywords, in the order typed (first spelling kept). */
  keywords: string[];
  /** Lines dropped because the same keyword (ignoring case and spacing) was already listed. */
  duplicates: number;
}

/** One keyword per line: trimmed, inner spaces collapsed, blank lines skipped, duplicates (case-insensitive) dropped. */
export function parseKeywords(text: string): ParsedKeywords {
  const seen = new Set<string>();
  const keywords: string[] = [];
  let duplicates = 0;
  for (const line of text.split(/\r?\n/)) {
    const keyword = line.trim().replace(/\s+/g, ' ');
    if (!keyword) continue;
    const key = keyword.toLowerCase();
    if (seen.has(key)) {
      duplicates += 1;
      continue;
    }
    seen.add(key);
    keywords.push(keyword);
  }
  return { keywords, duplicates };
}

/** Tags typed as "brand, services": trimmed, empty and repeated ones dropped. */
export function parseTags(text: string): string[] {
  const seen = new Set<string>();
  return text
    .split(',')
    .map((t) => t.trim())
    .filter((t) => {
      const key = t.toLowerCase();
      if (!t || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}
