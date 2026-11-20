import type { DataColumn } from '@/components/table/DataTable';
import { formatDecimal, formatNumber, formatPercent, formatPosition } from '../../lib/format';
import { REPORT_SORT_KEYS, type ReportKey, type ReportRows } from '../../types';
import { ChangeBadge } from '../ChangeBadge';
import { Chips, PageLink, Sparkline, WithChange } from './cells';

export interface ReportConfig<K extends ReportKey> {
  /** One plain-English line above the table. */
  explainer: string;
  /** A short tip shown after the explainer (e.g. what to do about it). */
  tip?: string;
  searchLabel: string;
  sortKeys: readonly string[];
  /** Report ignores the date range (content decay is always last 28 days vs the 28 before). */
  fixedRange?: boolean;
  noun: string;
  rowLabel: (row: ReportRows[K]) => string;
  empty: string;
  columns: DataColumn<ReportRows[K], string>[];
}

const clicksChange = (n: number | null) =>
  n === null ? null : <ChangeBadge value={n} format={formatNumber} label="Clicks" context="vs the compare period" />;
const positionChange = (n: number | null) =>
  n === null ? null : <ChangeBadge value={n} better="lower" format={formatDecimal} label="Position" context="vs the compare period" />;

const performanceColumns = <T extends ReportRows['queries'] | ReportRows['pages']>(): DataColumn<T, string>[] => [
  {
    label: 'Clicks',
    sortKey: 'clicks',
    align: 'right',
    skeleton: 'w-16',
    cell: (r) => <WithChange value={formatNumber(r.clicks)} change={clicksChange(r.clicksChange)} />,
  },
  { label: 'Impressions', sortKey: 'impressions', align: 'right', skeleton: 'w-16', cell: (r) => <span className="tabular-nums">{formatNumber(r.impressions)}</span> },
  { label: 'CTR', sortKey: 'ctr', align: 'right', skeleton: 'w-12', cell: (r) => <span className="tabular-nums">{formatPercent(r.ctr)}</span> },
  {
    label: 'Position',
    sortKey: 'position',
    align: 'right',
    skeleton: 'w-14',
    cell: (r) => <WithChange value={formatPosition(r.position)} change={positionChange(r.positionChange)} />,
  },
];

export const REPORTS: { [K in ReportKey]: ReportConfig<K> } = {
  queries: {
    explainer: 'What people searched for before they found the site, with clicks, impressions, click-through rate and average position.',
    searchLabel: 'Search queries',
    sortKeys: REPORT_SORT_KEYS.queries,
    noun: 'queries',
    rowLabel: (r) => r.query,
    empty: 'No searches in this period.',
    columns: [{ label: 'Query', skeleton: 'w-48', cell: (r) => <span className="font-medium break-words">{r.query}</span> }, ...performanceColumns<ReportRows['queries']>()],
  },
  pages: {
    explainer: 'How each page performs in Google Search over the period.',
    searchLabel: 'Search pages',
    sortKeys: REPORT_SORT_KEYS.pages,
    noun: 'pages',
    rowLabel: (r) => r.page,
    empty: 'No pages with impressions in this period.',
    columns: [{ label: 'Page', skeleton: 'w-56', cell: (r) => <PageLink url={r.page} className="max-w-md" /> }, ...performanceColumns<ReportRows['pages']>()],
  },
  'quick-wins': {
    explainer: "Searches where you rank 5–15 with lots of impressions — a push onto page one's top spots is the cheapest traffic you can win.",
    tip: 'Strengthen the ranking page: answer the search better, add internal links to it, and work the query into its title and headings.',
    searchLabel: 'Search queries',
    sortKeys: REPORT_SORT_KEYS['quick-wins'],
    noun: 'quick wins',
    rowLabel: (r) => r.query,
    empty: 'No quick wins in this period: no searches at positions 5–15 with enough impressions.',
    columns: [
      { label: 'Query', skeleton: 'w-44', cell: (r) => <span className="font-medium break-words">{r.query}</span> },
      { label: 'Ranking page', skeleton: 'w-40', wideOnCard: true, cell: (r) => <PageLink url={r.page} className="max-w-64" /> },
      { label: 'Position', sortKey: 'position', align: 'right', skeleton: 'w-10', cell: (r) => <span className="tabular-nums font-semibold">{formatPosition(r.position)}</span> },
      { label: 'Impressions', sortKey: 'impressions', align: 'right', skeleton: 'w-16', cell: (r) => <span className="tabular-nums">{formatNumber(r.impressions)}</span> },
      { label: 'Clicks', sortKey: 'clicks', align: 'right', skeleton: 'w-12', cell: (r) => <span className="tabular-nums">{formatNumber(r.clicks)}</span> },
      { label: 'CTR', sortKey: 'ctr', align: 'right', skeleton: 'w-12', cell: (r) => <span className="tabular-nums">{formatPercent(r.ctr)}</span> },
      {
        label: 'Potential clicks',
        sortKey: 'potential_clicks',
        align: 'right',
        skeleton: 'w-14',
        cell: (r) => (
          <span className="inline-flex rounded bg-ok-soft px-1.5 py-0.5 text-xs font-semibold tabular-nums text-ok" title="Estimated extra clicks a month if this search reached position 3">
            +{formatNumber(r.potentialClicks)}
          </span>
        ),
      },
    ],
  },
  'low-ctr': {
    explainer: 'Pages that rank well but get few clicks for their position. That usually means the title or meta description needs rewriting.',
    tip: 'Rewrite the title and meta description so they match what people searched for (the top queries) and give a reason to click.',
    searchLabel: 'Search pages',
    sortKeys: REPORT_SORT_KEYS['low-ctr'],
    noun: 'pages',
    rowLabel: (r) => r.page,
    empty: 'No low-CTR pages in this period: pages get the clicks their rankings deserve.',
    columns: [
      { label: 'Page', skeleton: 'w-48', cell: (r) => <PageLink url={r.page} className="max-w-72" /> },
      { label: 'Position', sortKey: 'position', align: 'right', skeleton: 'w-10', cell: (r) => <span className="tabular-nums">{formatPosition(r.position)}</span> },
      { label: 'Impressions', sortKey: 'impressions', align: 'right', skeleton: 'w-16', cell: (r) => <span className="tabular-nums">{formatNumber(r.impressions)}</span> },
      {
        label: 'CTR vs expected',
        sortKey: 'ctr',
        align: 'right',
        skeleton: 'w-24',
        cell: (r) => (
          <span className="inline-flex items-baseline justify-end gap-1 tabular-nums" aria-label={`CTR ${formatPercent(r.ctr)}, expected ${formatPercent(r.expectedCtr)}`}>
            <span className="font-semibold text-bad">{formatPercent(r.ctr)}</span>
            <span className="text-xs text-muted-foreground">/ {formatPercent(r.expectedCtr)}</span>
          </span>
        ),
      },
      { label: 'Missed clicks', sortKey: 'missed_clicks', align: 'right', skeleton: 'w-12', cell: (r) => <span className="tabular-nums font-semibold">{formatNumber(r.missedClicks)}</span> },
      { label: 'Top queries', skeleton: 'w-40', wideOnCard: true, cell: (r) => <Chips items={r.topQueries} /> },
    ],
  },
  'content-decay': {
    explainer: 'Pages losing search traffic month over month. Catch the slide early: refresh the content, update dates and facts, and check what now outranks it.',
    searchLabel: 'Search pages',
    sortKeys: REPORT_SORT_KEYS['content-decay'],
    fixedRange: true,
    noun: 'pages',
    rowLabel: (r) => r.page,
    empty: 'No decaying pages: nothing is losing traffic month over month.',
    columns: [
      { label: 'Page', skeleton: 'w-48', cell: (r) => <PageLink url={r.page} className="max-w-72" /> },
      { label: 'Last 28 days', sortKey: 'clicks_last_28', align: 'right', skeleton: 'w-14', cell: (r) => <span className="tabular-nums font-semibold">{formatNumber(r.clicksLast28)}</span> },
      { label: 'Previous 28 days', sortKey: 'clicks_prev_28', align: 'right', skeleton: 'w-14', cell: (r) => <span className="tabular-nums text-muted-foreground">{formatNumber(r.clicksPrev28)}</span> },
      {
        label: 'Change',
        sortKey: 'clicks_change_pct',
        align: 'right',
        skeleton: 'w-14',
        cell: (r) => <ChangeBadge value={r.clicksChangePct} format={(n) => `${formatDecimal(n)}%`} label="Clicks" context="vs the previous 28 days" />,
      },
      {
        label: '6-month trend',
        sortKey: 'decline_months',
        skeleton: 'w-24',
        cell: (r) => (
          <span className="inline-flex items-center gap-2">
            <Sparkline points={r.monthly.slice(-6)} />
            {r.declineMonths > 0 && (
              <span className="whitespace-nowrap text-2xs text-muted-foreground">
                {r.declineMonths} {r.declineMonths === 1 ? 'month' : 'months'} down
              </span>
            )}
          </span>
        ),
      },
    ],
  },
};
