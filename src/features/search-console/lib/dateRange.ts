import type { CompareMode } from '../types';

export const RANGE_PRESETS = [
  { key: '7d', label: 'Last 7 days', days: 7 },
  { key: '28d', label: 'Last 28 days', days: 28 },
  { key: '90d', label: 'Last 90 days', days: 90 },
  { key: '6m', label: 'Last 6 months', months: 6 },
  { key: '12m', label: 'Last 12 months', months: 12 },
  { key: '16m', label: 'Last 16 months', months: 16 },
] as const;

export type RangeKey = (typeof RANGE_PRESETS)[number]['key'];

export const DEFAULT_RANGE: RangeKey = '28d';

export const COMPARE_OPTIONS: readonly { key: CompareMode; label: string; short: string }[] = [
  { key: 'previous', label: 'Previous period', short: 'previous period' },
  { key: 'year', label: 'Same period last year', short: 'last year' },
  { key: 'none', label: 'No comparison', short: '' },
];

export const DEFAULT_COMPARE: CompareMode = 'previous';

export const isRangeKey = (v: string | null): v is RangeKey => RANGE_PRESETS.some((p) => p.key === v);
export const isCompareMode = (v: string | null): v is CompareMode => COMPARE_OPTIONS.some((o) => o.key === v);

/** A Y-m-d string for a local date (no time-zone drift from toISOString). */
export function toYmd(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Y-m-d → a local Date at midnight. */
export function fromYmd(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/**
 * The preset's start and end (inclusive, Y-m-d). Ranges end on the last day
 * with data (`dataThrough`, else yesterday): Search Console lags 2–3 days, so
 * "last 7 days" means the last 7 days we have.
 */
export function rangeFor(key: RangeKey, dataThrough: string | null, today = new Date()): { start: string; end: string } {
  const end = dataThrough ? fromYmd(dataThrough) : new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  const preset = RANGE_PRESETS.find((p) => p.key === key) ?? RANGE_PRESETS[1];
  const start =
    'days' in preset
      ? new Date(end.getFullYear(), end.getMonth(), end.getDate() - (preset.days - 1))
      : new Date(end.getFullYear(), end.getMonth() - preset.months, end.getDate() + 1);
  return { start: toYmd(start), end: toYmd(end) };
}
