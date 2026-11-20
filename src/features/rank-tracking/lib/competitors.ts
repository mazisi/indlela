import type { Competitor, CompetitorOverview, CompetitorStats, H2HOnly } from '../types';

/** Active competitors per site (the API's rank_tracking.max_competitors_per_site). */
export const MAX_COMPETITORS = 5;

/** Categorical slots in a fixed order: the site is slot 1, competitors take the next ones. */
const SERIES = ['var(--chart-current)', 'var(--series-2)', 'var(--series-3)', 'var(--series-4)', 'var(--series-5)', 'var(--series-6)'] as const;

export const SITE_COLOR = SERIES[0];
/** Past the last slot a series folds to neutral grey; a hue is never generated or reused. */
export const OTHER_COLOR = 'var(--chart-compare)';

/**
 * A competitor's colour follows the competitor, not its rank or how many are
 * shown: slots go by the order they were added (id), counting paused ones, so
 * pausing one never repaints the others.
 */
export function competitorColors(competitors: Pick<Competitor, 'id'>[]): Map<number, string> {
  const ids = [...new Set(competitors.map((c) => c.id))].sort((a, b) => a - b);
  return new Map(ids.map((id, i) => [id, SERIES[i + 1] ?? OTHER_COLOR]));
}

/**
 * The bare host of a domain or URL as typed: "https://www.Example.co.za/shop"
 * → "example.co.za". Null when it isn't a plausible domain.
 */
export function normaliseDomain(input: string): string | null {
  const text = input.trim();
  if (!text) return null;
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `https://${text}`);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    const host = url.hostname.toLowerCase().replace(/^www\./, '').replace(/\.$/, '');
    return /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z][a-z0-9-]{0,62}$/.test(host) ? host : null;
  } catch {
    return null;
  }
}

/** The same domain, or one of its subdomains. */
export const isSameOrSubdomain = (host: string, of: string) => host === of || host.endsWith(`.${of}`);

/** Not in the top 100 counts as 101, as the API compares. */
const rankValue = (position: number | null | undefined) => (position && position > 0 ? position : 101);

/** The competitor ranks above the site (both out of the top 100 is a tie). */
export const isAhead = (theirs: number | null | undefined, ours: number | null | undefined) => rankValue(theirs) < rankValue(ours);

/** A share of voice as shown: one decimal under 10%, whole above. */
export const formatShare = (sov: number | null | undefined) => {
  if (typeof sov !== 'number' || !Number.isFinite(sov)) return '—';
  return `${sov > 0 && sov < 10 ? sov.toFixed(1).replace(/\.0$/, '') : Math.round(sov)}%`;
};

export const H2H_FILTERS: { value: H2HOnly; label: string }[] = [
  { value: 'losing', label: 'Losing' },
  { value: 'winning', label: 'Winning' },
  { value: 'key', label: 'Key keywords' },
];

export const isH2HOnly = (v: string | null): v is H2HOnly => H2H_FILTERS.some((f) => f.value === v);

/** Competitor history started within the trend's 12 weeks: the earlier weeks have no competitor data. */
export function historyIsRecent(historySince: string | null, today = new Date()): boolean {
  if (!historySince) return false;
  const since = Date.parse(`${historySince.slice(0, 10)}T00:00:00`);
  return Number.isFinite(since) && today.getTime() - since < 12 * 7 * 86_400_000;
}

/** A week as "3 Nov" (its Monday), for the trend. */
export const weekLabel = (ymd: string) => new Date(`${ymd.slice(0, 10)}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

/** One line / segment in the share-of-voice charts. */
export interface SovSeries {
  /** `site`, or `c{id}` for a competitor (a chart data key). */
  key: string;
  competitorId: number | null;
  name: string;
  domain: string;
  color: string;
  isSite: boolean;
  stats: CompetitorStats;
}

/**
 * The site, then its active competitors in the order they were added: the
 * fixed series order for the share-of-voice charts, legend and table.
 */
export function sovSeries(overview: CompetitorOverview, colors: Map<number, string>): SovSeries[] {
  const { domain, ...site } = overview.site;
  return [
    { key: 'site', competitorId: null, name: 'You', domain, color: SITE_COLOR, isSite: true, stats: site },
    ...[...overview.competitors]
      .sort((a, b) => a.id - b.id)
      .map(({ id, name, domain: d, ...stats }) => ({ key: `c${id}`, competitorId: id, name, domain: d, color: colors.get(id) ?? OTHER_COLOR, isSite: false, stats })),
  ];
}
