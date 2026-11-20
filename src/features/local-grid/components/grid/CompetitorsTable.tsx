import { Paginator } from '@/components/Paginator';
import { DataTable, type DataColumn } from '@/components/table/DataTable';
import { useClientPagination } from '@/hooks/useClientPagination';
import { formatNumber } from '@/features/search-console/lib/format';
import { formatAvgRank } from '../../lib/labels';
import type { Competitor, GridBusiness } from '../../types';
import { Rating } from '../cells';

const isTarget = (c: Competitor, b: GridBusiness) => Boolean((b.placeId && c.placeId === b.placeId) || (b.cid && c.cid === b.cid));

function Share({ n, total }: { n: number; total: number }) {
  const pct = total > 0 ? Math.round((n / total) * 100) : 0;
  return (
    <span className="flex items-center justify-end gap-2">
      <span className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-muted lg:block" aria-hidden>
        <span className="block h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </span>
      <span className="tabular-nums">
        {formatNumber(n)} <span className="text-xs text-muted-foreground">of {formatNumber(total)}</span>
      </span>
    </span>
  );
}

/** Who holds the map pack's top 3 most across the grid (the API's top 10), the tracked business marked. */
export function CompetitorsTable({ competitors, pointsTotal, business }: { competitors: Competitor[]; pointsTotal: number; business: GridBusiness }) {
  const paging = useClientPagination(competitors);
  const columns: DataColumn<Competitor, string>[] = [
    {
      label: 'Business',
      cell: (c) => (
        <span className="block min-w-0 max-w-80">
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-medium">{c.title}</span>
            {isTarget(c, business) && <span className="shrink-0 rounded bg-primary px-1.5 py-px text-2xs font-semibold text-primary-foreground">Your business</span>}
          </span>
          <Rating rating={c.rating} votes={c.votes} />
        </span>
      ),
    },
    { label: 'In the top 3 at', align: 'right', cell: (c) => <Share n={c.top3Points} total={pointsTotal} /> },
    { label: 'Found at', align: 'right', cell: (c) => <Share n={c.foundPoints} total={pointsTotal} /> },
    { label: 'Avg rank', align: 'right', cell: (c) => <span className="font-semibold tabular-nums">{formatAvgRank(c.avgRank)}</span> },
  ];

  if (competitors.length === 0) {
    return <p className="rounded border border-dashed bg-card px-4 py-6 text-center text-sm text-muted-foreground">No competitors recorded for this scan.</p>;
  }
  return (
    <div>
      <DataTable rows={paging.pageRows} columns={columns} rowLabel={(c) => c.title} noun="competitors" rowClassName={(c) => (isTarget(c, business) ? 'bg-accent/40' : undefined)} />
      <Paginator
        currentPage={paging.meta.currentPage}
        lastPage={paging.meta.lastPage}
        totalItems={paging.meta.total}
        perPage={paging.meta.perPage}
        onPageChange={paging.onPageChange}
        onPerPageChange={paging.onPerPageChange}
      />
    </div>
  );
}
