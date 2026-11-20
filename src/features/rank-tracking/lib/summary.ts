import type { VisibilityPoint } from '../types';

const DAY_MS = 86_400_000;
const ymdTime = (ymd: string) => Date.parse(`${ymd.slice(0, 10)}T00:00:00Z`);

/**
 * The series point `days` before its last one (the latest on or before that
 * day), for "vs 7 days ago"; undefined when the series doesn't go back that far.
 */
export function pointDaysBefore(series: VisibilityPoint[], days: number): VisibilityPoint | undefined {
  if (series.length === 0) return undefined;
  const target = ymdTime(series[series.length - 1].date) - days * DAY_MS;
  let found: VisibilityPoint | undefined;
  for (const p of series) {
    if (ymdTime(p.date) <= target) found = p;
  }
  return found;
}

/** current − previous, or null when either is missing. */
export const delta = (current: number | null | undefined, previous: number | null | undefined): number | null =>
  typeof current === 'number' && typeof previous === 'number' ? current - previous : null;
