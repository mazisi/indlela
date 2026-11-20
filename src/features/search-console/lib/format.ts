/**
 * Number formatting for the Search Console screens: thousands separators,
 * CTR as a percentage, position to one decimal. One locale (en-GB, as dates)
 * so every figure reads the same.
 */
const LOCALE = 'en-GB';

const integer = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat(LOCALE, { notation: 'compact', maximumFractionDigits: 1 });
const oneDecimal = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const finite = (n: number | null | undefined): n is number => typeof n === 'number' && Number.isFinite(n);

/** 12345 → "12,345". */
export const formatNumber = (n: number | null | undefined): string => (finite(n) ? integer.format(n) : '—');

/** 12345 → "12.3K", for chart axes. */
export const formatCompact = (n: number | null | undefined): string => (finite(n) ? compact.format(n) : '—');

/** A 0–1 fraction as a percentage: 0.0345 → "3.5%" (two decimals under 1 %: 0.0042 → "0.42%"). */
export function formatPercent(fraction: number | null | undefined): string {
  if (!finite(fraction)) return '—';
  const pct = fraction * 100;
  const digits = pct !== 0 && Math.abs(pct) < 1 ? 2 : 1;
  return `${pct.toLocaleString(LOCALE, { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`;
}

/** Average position to one decimal: 7.456 → "7.5". */
export const formatPosition = (n: number | null | undefined): string => (finite(n) && n > 0 ? oneDecimal.format(n) : '—');

/** One decimal, no sign: 12.34 → "12.3". */
export const formatDecimal = (n: number | null | undefined): string => (finite(n) ? oneDecimal.format(n) : '—');

/** Relative change in percent, or null when there is nothing to compare with. */
export function percentChange(current: number, previous: number | null | undefined): number | null {
  if (!finite(previous) || !finite(current)) return null;
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

/** A URL without its scheme and host, for compact page columns: "https://x.co.za/blog/a" → "/blog/a". */
export function pagePath(url: string): string {
  try {
    const u = new URL(url);
    return `${u.pathname}${u.search}` || '/';
  } catch {
    return url;
  }
}
