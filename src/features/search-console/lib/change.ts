/** Which way is good for a metric: more clicks is better, a lower (closer to 1) position is better. */
export type Better = 'higher' | 'lower';

export type ChangeTone = 'good' | 'bad' | 'flat';

export interface ChangeView {
  tone: ChangeTone;
  /** Arrow direction: up = better (more clicks, or moved up the rankings), down = worse. */
  arrow: 'up' | 'down' | 'none';
  /** Plain words for screen readers, e.g. "up", "worsened". */
  word: string;
}

/**
 * How to show a change: `delta` is current − previous in the metric's own
 * units (a position going 8 → 6 is −2, which is an improvement).
 */
export function describeChange(delta: number, better: Better, epsilon = 1e-9): ChangeView {
  if (!Number.isFinite(delta) || Math.abs(delta) < epsilon) return { tone: 'flat', arrow: 'none', word: 'unchanged' };
  const improved = better === 'higher' ? delta > 0 : delta < 0;
  const word = better === 'higher' ? (delta > 0 ? 'up' : 'down') : improved ? 'improved' : 'worsened';
  return { tone: improved ? 'good' : 'bad', arrow: improved ? 'up' : 'down', word };
}
