import type { YearMonth } from '../types';

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
/** Sub-dollar amounts keep up to 4 decimals: a single check costs $0.0006. */
const USD_SMALL = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 4 });
const USD_WHOLE = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 });

const finite = (n: number | null | undefined): n is number => typeof n === 'number' && Number.isFinite(n);

/** 31.2 → "$31.20"; 0.0036 → "$0.0036"; null → "—". */
export function formatUsd(n: number | null | undefined): string {
  if (!finite(n)) return '—';
  return n !== 0 && Math.abs(n) < 1 ? USD_SMALL.format(n) : USD.format(n);
}

/** A cap or axis figure without needless cents: 50 → "$50", 12.5 → "$12.50". */
export const formatUsdShort = (n: number): string => (Number.isInteger(n) ? USD_WHOLE.format(n) : USD.format(n));

const monthDate = (ym: YearMonth) => new Date(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)) - 1, 1);

/** "2026-11" → "November 2026". */
export const monthLabel = (ym: YearMonth): string => monthDate(ym).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

/** "2026-11" → "Nov". */
export const shortMonth = (ym: YearMonth): string => monthDate(ym).toLocaleDateString('en-GB', { month: 'short' });

export type SpendLevel = 'none' | 'ok' | 'near' | 'over';

/** From this share of the cap the spend turns amber. */
export const NEAR_CAP_PCT = 80;

/** Spend against the monthly cap: amber from 80 %, red at 100 %; 'none' without a cap. */
export function spendLevel(capUsedPct: number | null | undefined, cap: number | null | undefined): SpendLevel {
  if (!cap || !finite(capUsedPct)) return 'none';
  if (capUsedPct >= 100) return 'over';
  return capUsedPct >= NEAR_CAP_PCT ? 'near' : 'ok';
}
