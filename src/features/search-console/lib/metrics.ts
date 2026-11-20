import type { Better } from './change';
import { formatCompact, formatDecimal, formatNumber, formatPercent, formatPosition, percentChange } from './format';
import type { Totals } from '../types';

export type MetricKey = keyof Totals;

export interface MetricDef {
  key: MetricKey;
  label: string;
  /** The tile's long label. */
  title: string;
  better: Better;
  format: (n: number | null) => string;
  /** Chart axis ticks. */
  tick: (n: number) => string;
  /** Change vs the compare totals, in the unit `changeFormat` shows. */
  change: (current: Totals, previous: Totals) => number | null;
  changeFormat: (abs: number) => string;
  hint: string;
}

export const METRICS: readonly MetricDef[] = [
  {
    key: 'clicks',
    label: 'Clicks',
    title: 'Clicks',
    better: 'higher',
    format: formatNumber,
    tick: formatCompact,
    change: (c, p) => percentChange(c.clicks, p.clicks),
    changeFormat: (n) => `${formatDecimal(n)}%`,
    hint: 'Visits from Google Search',
  },
  {
    key: 'impressions',
    label: 'Impressions',
    title: 'Impressions',
    better: 'higher',
    format: formatNumber,
    tick: formatCompact,
    change: (c, p) => percentChange(c.impressions, p.impressions),
    changeFormat: (n) => `${formatDecimal(n)}%`,
    hint: 'Times the site showed in results',
  },
  {
    key: 'ctr',
    label: 'CTR',
    title: 'Average CTR',
    better: 'higher',
    format: formatPercent,
    tick: (n) => formatPercent(n),
    // Percentage points: 3.1 % → 3.5 % is +0.4 pp.
    change: (c, p) => (c.ctr - p.ctr) * 100,
    changeFormat: (n) => `${formatDecimal(n)} pp`,
    hint: 'Clicks per impression',
  },
  {
    key: 'position',
    label: 'Position',
    title: 'Average position',
    better: 'lower',
    format: formatPosition,
    tick: formatDecimal,
    change: (c, p) => (c.position && p.position ? c.position - p.position : null),
    changeFormat: formatDecimal,
    hint: 'Lower is better (1 is the top)',
  },
];

export const metricDef = (key: MetricKey): MetricDef => METRICS.find((m) => m.key === key) ?? METRICS[0];
