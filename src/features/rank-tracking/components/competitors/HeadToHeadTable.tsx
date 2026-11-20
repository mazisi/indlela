import { Search, SearchX, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Segmented } from '@/components/form/Segmented';
import { Paginator } from '@/components/Paginator';
import { DataTable, DataTableSkeleton, type DataColumn } from '@/components/table/DataTable';
import { useListParams } from '@/hooks/useListParams';
import { useUrlSort } from '@/hooks/useUrlSort';
import { cn } from '@/lib/utils';
import { useHeadToHead } from '../../hooks/useCompetitors';
import { H2H_FILTERS, isAhead, isH2HOnly } from '../../lib/competitors';
import { H2H_SORT_KEYS, type H2HOnly, type H2HPosition, type H2HSortKey, type HeadToHeadRow } from '../../types';
import { DeviceIcon, PositionChange, Rank } from '../cells';
import { LoadError } from '../LoadError';
import { SeriesSwatch } from './ShareOfVoiceCard';

export interface H2HCompetitor {
  id: number;
  name: string;
  color: string;
}

function PositionWithChange({ p, tint, label }: { p: H2HPosition | undefined; tint?: boolean; label: string }) {
  return (
    <span
      className={cn('inline-flex items-center justify-end gap-1.5 rounded px-1.5 py-0.5', tint && 'bg-bad-soft')}
      data-ahead={tint ? 'true' : undefined}
      title={tint ? `${label} ranks above you` : undefined}
    >
      <Rank position={p?.position} />
      {p?.change ? <PositionChange value={p.change} context="since the previous check" className="px-1 py-0 text-2xs" /> : null}
      {tint && <span className="sr-only">, ahead of you</span>}
    </span>
  );
}

/** Best competitor − ours: positive = the site leads. */
function Gap({ gap }: { gap: number | null }) {
  if (gap === null || gap === undefined) return <span className="text-muted-foreground">—</span>;
  if (gap === 0) return <span className="tabular-nums text-muted-foreground">Level</span>;
  const ahead = gap > 0;
  return (
    <span className={cn('font-semibold tabular-nums', ahead ? 'text-ok' : 'text-bad')} title={ahead ? `You lead the best competitor by ${gap}` : `The best competitor leads you by ${-gap}`}>
      {ahead ? '+' : '−'}
      {Math.abs(gap)}
      <span className="sr-only">{ahead ? ' (you lead)' : ' (behind)'}</span>
    </span>
  );
}

const columns = (competitors: H2HCompetitor[]): DataColumn<HeadToHeadRow, H2HSortKey>[] => [
  {
    label: 'Keyword',
    sortKey: 'keyword',
    skeleton: 'w-40',
    cell: (r) => (
      <span className="block min-w-0 max-w-64">
        <span className="flex items-center gap-1.5">
          {r.isKey && (
            <span role="img" aria-label="Key keyword" title="Key keyword" className="shrink-0">
              <Star className="size-3.5 fill-warn text-warn" aria-hidden />
            </span>
          )}
          <span className="truncate text-sm font-medium">{r.keyword}</span>
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="truncate">{r.locationName}</span>
          <DeviceIcon device={r.device} />
        </span>
      </span>
    ),
  },
  { label: 'You', sortKey: 'position', align: 'right', skeleton: 'w-8', cell: (r) => <PositionWithChange p={r.ours} label="You" /> },
  ...competitors.map(
    (c): DataColumn<HeadToHeadRow, H2HSortKey> => ({
      label: c.name,
      align: 'right',
      skeleton: 'w-8',
      cell: (r) => {
        const theirs = r.competitors.find((x) => x.id === c.id);
        return <PositionWithChange p={theirs} tint={Boolean(theirs) && isAhead(theirs?.position, r.ours.position)} label={c.name} />;
      },
    }),
  ),
  { label: 'Gap', sortKey: 'gap', align: 'right', skeleton: 'w-6', cell: (r) => <Gap gap={r.gap} /> },
];

/** Unique column labels (two competitors may share a name). */
const uniqueNames = (competitors: H2HCompetitor[]) => {
  const seen = new Map<string, number>();
  return competitors.map((c) => {
    const n = (seen.get(c.name) ?? 0) + 1;
    seen.set(c.name, n);
    return n > 1 ? { ...c, name: `${c.name} (${n})` } : c;
  });
};

const ONLY_OPTIONS = [['all', 'All'] as const, ...H2H_FILTERS.map((f) => [f.value, f.label] as const)];

/**
 * Every keyword's position for the site and each active competitor on the
 * latest check, with the change since the previous one; a competitor's cell
 * is tinted where it ranks above the site. Search, Losing / Winning / Key
 * filters, sort and page live in the URL.
 */
export function HeadToHeadTable({ siteId, competitors }: { siteId: number; competitors: H2HCompetitor[] }) {
  const list = useListParams();
  const { sort, onSort } = useUrlSort(H2H_SORT_KEYS);
  const onlyParam = list.params.get('only');
  const only: H2HOnly | undefined = isH2HOnly(onlyParam) ? onlyParam : undefined;
  const query = useHeadToHead(siteId, { page: list.page, perPage: list.perPage, search: list.search, only, sort });
  const rows = query.data?.data ?? [];
  const meta = query.data?.meta;
  const cols = columns(uniqueNames(competitors));
  const filtered = Boolean(list.search || only);

  return (
    <section className="space-y-3" aria-labelledby="h2h-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="h2h-title" className="text-sm font-semibold">
            Head-to-head
          </h2>
          <p className="text-xs text-muted-foreground">Your position against each competitor on every keyword. Red cells rank above you.</p>
        </div>
        <ul className="flex flex-wrap gap-x-3 gap-y-1" aria-label="Competitor colours">
          {competitors.map((c) => (
            <li key={c.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <SeriesSwatch color={c.color} />
              <span className="max-w-32 truncate">{c.name}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input type="search" value={list.searchInput} onChange={(e) => list.setSearchInput(e.target.value)} placeholder="Search keywords" aria-label="Search head-to-head keywords" className="bg-card pl-9" />
        </div>
        <Segmented label="Show" value={only ?? 'all'} onChange={(v) => list.update({ only: v === 'all' ? undefined : v, page: undefined })} options={ONLY_OPTIONS} />
      </div>

      {query.isError ? (
        <LoadError error={query.error} what="the head-to-head" onRetry={() => query.refetch()} />
      ) : query.isPending ? (
        <DataTableSkeleton columns={cols} label="Loading the head-to-head" selectable={false} actions={false} />
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded border border-dashed bg-card px-6 py-12 text-center">
          <SearchX className="size-6 text-muted-foreground" aria-hidden />
          <p className="text-sm font-medium">{filtered ? 'No keywords match' : 'No positions yet'}</p>
          <p className="max-w-md text-sm text-muted-foreground">
            {only === 'losing'
              ? 'No competitor ranks above you on these keywords. Nice.'
              : only === 'key'
                ? 'Star keywords on the Keywords tab to mark them as key.'
                : filtered
                  ? 'Try a different search or filter.'
                  : 'Positions appear here after the next check of your keywords.'}
          </p>
        </div>
      ) : (
        <div className={cn('transition-opacity', query.isFetching && !query.isRefetching && 'opacity-60')}>
          <DataTable rows={rows} columns={cols} rowLabel={(r) => r.keyword} noun="keywords" sort={sort} onSort={onSort} />
          {meta && (
            <Paginator currentPage={meta.currentPage} lastPage={meta.lastPage} totalItems={meta.total} perPage={meta.perPage} onPageChange={list.onPageChange} onPerPageChange={list.onPerPageChange} />
          )}
        </div>
      )}
    </section>
  );
}
