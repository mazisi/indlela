import type { VitalCategory, VitalsRow } from '../types';

/**
 * Google's Core Web Vitals thresholds (p75): good up to the first number,
 * needs improvement up to the second, poor above it.
 * https://web.dev/articles/vitals
 */
export const THRESHOLDS = {
  lcp: [2500, 4000],
  inp: [200, 500],
  cls: [0.1, 0.25],
  /** Lab stand-in for INP (Lighthouse's Total Blocking Time). */
  tbt: [200, 600],
} as const;

export type VitalKey = keyof typeof THRESHOLDS;

export function categorise(metric: VitalKey, value: number): VitalCategory {
  const [good, poor] = THRESHOLDS[metric];
  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}

export const CATEGORY_LABELS: Record<VitalCategory, string> = { good: 'Good', 'needs-improvement': 'Needs improvement', poor: 'Poor' };

export const CATEGORY_TONE: Record<VitalCategory, { text: string; soft: string; bar: string }> = {
  good: { text: 'text-ok', soft: 'bg-ok-soft', bar: 'bg-ok' },
  'needs-improvement': { text: 'text-warn', soft: 'bg-warn-soft', bar: 'bg-warn' },
  poor: { text: 'text-bad', soft: 'bg-bad-soft', bar: 'bg-bad' },
};

/** "2.4 s", "180 ms", "0.08". */
export function formatVital(metric: VitalKey, value: number): string {
  if (metric === 'cls') return value.toFixed(2);
  if (metric === 'lcp') return `${(value / 1000).toFixed(1)} s`;
  return `${Math.round(value)} ms`;
}

export interface VitalReading {
  key: VitalKey;
  /** LCP, INP, CLS or TBT. */
  name: string;
  /** What it measures, in a few words. */
  hint: string;
  value: number;
  category: VitalCategory;
}

const NAMES: Record<VitalKey, { name: string; hint: string }> = {
  lcp: { name: 'LCP', hint: 'Largest Contentful Paint: how long the main content takes to show' },
  inp: { name: 'INP', hint: 'Interaction to Next Paint: how quickly the page responds to taps and clicks' },
  cls: { name: 'CLS', hint: 'Cumulative Layout Shift: how much the page jumps around while loading' },
  tbt: { name: 'TBT', hint: 'Total Blocking Time: how long the page is too busy to respond (lab stand-in for INP)' },
};

const reading = (key: VitalKey, value: number | null | undefined): VitalReading | null =>
  value === null || value === undefined || !Number.isFinite(value) ? null : { key, ...NAMES[key], value, category: categorise(key, value) };

/**
 * The three readings for a URL: real-user (field) LCP, INP and CLS when
 * Google has them; otherwise Lighthouse's lab LCP, TBT and CLS.
 */
export function vitalReadings(row: VitalsRow): { source: 'field' | 'lab' | 'none'; readings: VitalReading[] } {
  const field = row.field;
  if (field && (field.lcpMs != null || field.inpMs != null || field.cls != null)) {
    const readings = [reading('lcp', field.lcpMs), reading('inp', field.inpMs), reading('cls', field.cls)];
    return { source: 'field', readings: readings.filter((r): r is VitalReading => r !== null) };
  }
  const lab = row.lab;
  if (lab) {
    const readings = [reading('lcp', lab.lcpMs), reading('tbt', lab.tbtMs), reading('cls', lab.cls)];
    return { source: 'lab', readings: readings.filter((r): r is VitalReading => r !== null) };
  }
  return { source: 'none', readings: [] };
}
