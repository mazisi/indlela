import type { ReportPeriod } from '../types';

/** The Generate form's period: the API's periods plus "a specific month" (sent as a custom range). */
export type FormPeriod = ReportPeriod | 'month';

export const PERIOD_OPTIONS: readonly { value: FormPeriod; label: string }[] = [
  { value: 'last_month', label: 'Last month' },
  { value: 'this_month', label: 'This month so far' },
  { value: 'month', label: 'A specific month' },
  { value: 'last_3_months', label: 'Last 3 months' },
  { value: 'custom', label: 'Custom range' },
];

/** How many whole months back can be chosen (Search Console keeps 16 months). */
export const MONTHS_BACK = 16;

/** The last 16 whole months, newest first: [{value: '2026-10', label: 'October 2026'}, …]. */
export function monthOptions(today = new Date()): { value: string; label: string }[] {
  return Array.from({ length: MONTHS_BACK }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - 1 - i, 1);
    return { value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: MONTH.format(d) };
  });
}

/** '2026-10' → its first and last day as Y-m-d. */
export function monthRange(ym: string): { start: string; end: string } {
  const [y, m] = ym.split('-').map(Number);
  return { start: toYmd(new Date(y, m - 1, 1)), end: toYmd(new Date(y, m, 0)) };
}

const LONG = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
const MONTH = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' });

/** A Y-m-d as a local date (no time-zone shift). */
export function fromYmd(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export const toYmd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** "1 December 2026". */
export const formatLongDate = (d: Date | string) => LONG.format(typeof d === 'string' ? fromYmd(d) : d);

/**
 * The dates a period covers, as the API resolves them: last month = the
 * whole previous calendar month, this month = the 1st to yesterday (today
 * on the 1st), last 3 months = the three whole months before this one.
 */
export function resolvePeriod(period: Exclude<ReportPeriod, 'custom'>, today = new Date()): { start: Date; end: Date } {
  const y = today.getFullYear();
  const m = today.getMonth();
  if (period === 'this_month') {
    const start = new Date(y, m, 1);
    const end = today.getDate() === 1 ? start : new Date(y, m, today.getDate() - 1);
    return { start, end };
  }
  const months = period === 'last_3_months' ? 3 : 1;
  return { start: new Date(y, m - months, 1), end: new Date(y, m, 0) };
}

/** "October 2026", "1 – 19 November 2026", "August – October 2026", "3 March – 2 April 2026". */
export function describeRange(start: Date, end: Date): string {
  const sameMonth = start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth();
  const wholeMonths = start.getDate() === 1 && new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate() === end.getDate();
  if (wholeMonths) {
    if (sameMonth) return MONTH.format(start);
    const from = start.getFullYear() === end.getFullYear() ? start.toLocaleDateString('en-GB', { month: 'long' }) : MONTH.format(start);
    return `${from} – ${MONTH.format(end)}`;
  }
  if (sameMonth) return `${start.getDate()} – ${LONG.format(end)}`;
  const from = start.getFullYear() === end.getFullYear() ? start.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }) : LONG.format(start);
  return `${from} – ${LONG.format(end)}`;
}

/** "October 2026": the calendar month before `today` (what "Send now" and the monthly report cover). */
export const lastMonthLabel = (today = new Date()) =>
  new Intl.DateTimeFormat('en-ZA', { month: 'long', year: 'numeric' }).format(new Date(today.getFullYear(), today.getMonth() - 1, 1));
