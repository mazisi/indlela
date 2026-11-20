/**
 * Score bands. Health (the audit's 0–100): 80+ good, 50–79 needs work,
 * under 50 poor. Lighthouse performance: 90+ good, 50–89 needs
 * improvement, under 50 poor (Google's own bands).
 */
export type Band = 'good' | 'fair' | 'poor';

export interface BandView {
  band: Band;
  label: string;
}

export function healthBand(score: number): BandView {
  if (score >= 80) return { band: 'good', label: 'Good' };
  if (score >= 50) return { band: 'fair', label: 'Needs work' };
  return { band: 'poor', label: 'Poor' };
}

export function performanceBand(score: number): BandView {
  if (score >= 90) return { band: 'good', label: 'Good' };
  if (score >= 50) return { band: 'fair', label: 'Needs improvement' };
  return { band: 'poor', label: 'Poor' };
}

/** Status colours (reserved for state; always shown with a label). */
export const BAND_TONE: Record<Band, { text: string; fill: string; soft: string; stroke: string; track: string }> = {
  good: { text: 'text-ok', fill: 'bg-ok', soft: 'bg-ok-soft', stroke: 'var(--ok)', track: 'var(--ok-soft)' },
  fair: { text: 'text-warn', fill: 'bg-warn', soft: 'bg-warn-soft', stroke: 'var(--warn)', track: 'var(--warn-soft)' },
  poor: { text: 'text-bad', fill: 'bg-bad', soft: 'bg-bad-soft', stroke: 'var(--bad)', track: 'var(--bad-soft)' },
};

/** A band as a StatTile tone. */
export const BAND_STAT_TONE = { good: 'ok', fair: 'warn', poor: 'bad' } as const satisfies Record<Band, string>;
