import { Search, Target } from 'lucide-react';
import { DataTable, type DataColumn } from '@/components/table/DataTable';
import { ChangeBadge } from '@/features/search-console/components/ChangeBadge';
import { formatNumber, formatPosition, pagePath } from '@/features/search-console/lib/format';
import { METRICS } from '@/features/search-console/lib/metrics';
import type { SearchConsoleSnapshot } from '../../types';
import { ClicksChart } from './ClicksChart';
import { ReportCard, ReportSectionShell, ReportTile, TableBlock } from './ReportBlocks';

type Query = NonNullable<SearchConsoleSnapshot['topQueries']>[number] & { id: number };
type PageRow = NonNullable<SearchConsoleSnapshot['topPages']>[number] & { id: number };

const withIds = <T,>(rows: T[] | undefined) => (rows ?? []).map((r, id) => ({ ...r, id }));

const QUERY_COLUMNS: DataColumn<Query, string>[] = [
  { label: 'Search', className: 'whitespace-normal', cell: (q) => <span className="line-clamp-2 max-w-64 text-sm font-medium">{q.query}</span> },
  { label: 'Clicks', align: 'right', cell: (q) => <span className="tabular-nums">{formatNumber(q.clicks)}</span> },
  { label: 'Impressions', align: 'right', cell: (q) => <span className="tabular-nums">{formatNumber(q.impressions)}</span> },
  { label: 'Position', align: 'right', cell: (q) => <span className="tabular-nums">{formatPosition(q.position)}</span> },
];

const PAGE_COLUMNS: DataColumn<PageRow, string>[] = [
  {
    label: 'Page',
    className: 'whitespace-normal',
    cell: (p) => (
      <span className="line-clamp-2 max-w-64 break-all text-sm font-medium" title={p.page}>
        {pagePath(p.page)}
      </span>
    ),
  },
  { label: 'Clicks', align: 'right', cell: (p) => <span className="tabular-nums">{formatNumber(p.clicks)}</span> },
  { label: 'Impressions', align: 'right', cell: (p) => <span className="tabular-nums">{formatNumber(p.impressions)}</span> },
  { label: 'Position', align: 'right', cell: (p) => <span className="tabular-nums">{formatPosition(p.position)}</span> },
];

/** Google Search Console for the period: the four figures with their change, clicks by day, top searches and pages, quick wins. */
export function SearchConsoleSection({ data, compareLabel }: { data: SearchConsoleSnapshot; compareLabel: string | null }) {
  const unavailable = !data.available || !data.totals ? (data.reason ?? 'Search Console figures are not available for this period.') : null;
  const totals = data.totals;
  const before = data.compareTotals ?? null;
  const queries = withIds(data.topQueries);
  const pages = withIds(data.topPages);
  const wins = data.quickWins ?? [];

  return (
    <ReportSectionShell icon={Search} title="Search Console" subtitle="How the site performed in Google Search" unavailable={unavailable}>
      {totals && (
        <div className="space-y-3">
          <div role="group" aria-label="Search performance" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {METRICS.map((m) => (
              <ReportTile
                key={m.key}
                label={m.title}
                value={m.format(totals[m.key])}
                foot={
                  before && compareLabel ? (
                    <>
                      <ChangeBadge value={m.change(totals, before)} better={m.better} format={m.changeFormat} label={m.title} context={`vs ${compareLabel}`} />
                      <span className="truncate">vs {m.format(before[m.key])}</span>
                    </>
                  ) : (
                    <span className="truncate">{m.hint}</span>
                  )
                }
              />
            ))}
          </div>

          <ClicksChart series={data.series ?? []} />

          <div className="grid gap-3 lg:grid-cols-2">
            <TableBlock title="Top searches" aside="By clicks" empty="No searches with clicks this period.">
              {queries.length > 0 && <DataTable rows={queries} columns={QUERY_COLUMNS} rowLabel={(q) => q.query} noun="searches" />}
            </TableBlock>
            <TableBlock title="Top pages" aside="By clicks" empty="No pages with clicks this period.">
              {pages.length > 0 && <DataTable rows={pages} columns={PAGE_COLUMNS} rowLabel={(p) => p.page} noun="pages" />}
            </TableBlock>
          </div>

          {wins.length > 0 && (
            <ReportCard title="Quick wins" aside="Close to page one, with plenty of searches">
              <ul className="divide-y">
                {wins.map((w) => (
                  <li key={`${w.query}-${w.page}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5">
                    <Target className="size-4 shrink-0 text-(--brand-accent)" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{w.query}</span>
                      <span className="block truncate text-xs text-muted-foreground" title={w.page}>
                        {pagePath(w.page)}
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Position <span className="font-semibold tabular-nums text-foreground">{formatPosition(w.position)}</span> · <span className="tabular-nums">{formatNumber(w.impressions)}</span> impressions
                    </span>
                    <span className="rounded bg-ok-soft px-1.5 py-0.5 text-xs font-semibold tabular-nums text-ok">+{formatNumber(w.potentialClicks)} clicks possible</span>
                  </li>
                ))}
              </ul>
            </ReportCard>
          )}
        </div>
      )}
    </ReportSectionShell>
  );
}
