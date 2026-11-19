export type BadgeTone = 'bad' | 'neutral';
export interface NavBadge {
  count: number;
  tone: BadgeTone;
}

/** Keyed `module` or `module.item` (e.g. `site_audit`, `clients.sites`). */
export type NavCounts = Record<string, NavBadge>;

const NONE: NavCounts = {};

/**
 * Menu badges (red = needs action), as in workforce-app. Only counts backed
 * by real data are shown; each module adds its own as it is built (e.g. new
 * critical audit issues). None yet.
 */
export function useNavCounts(): NavCounts {
  return NONE;
}

/** A module's badge: the sum of its items' badges; red if any of them is. */
export function moduleBadge(counts: NavCounts, moduleKey: string, itemKeys: string[]): NavBadge | null {
  const own = counts[moduleKey];
  if (own) return own;
  const parts = itemKeys.map((k) => counts[`${moduleKey}.${k}`]).filter((b): b is NavBadge => Boolean(b));
  if (parts.length === 0) return null;
  return {
    count: parts.reduce((sum, b) => sum + b.count, 0),
    tone: parts.some((b) => b.tone === 'bad') ? 'bad' : 'neutral',
  };
}
