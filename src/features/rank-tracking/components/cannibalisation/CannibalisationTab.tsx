import { CheckCircle2, Lightbulb } from 'lucide-react';
import { Paginator } from '@/components/Paginator';
import { DataTable, DataTableSkeleton, type DataColumn } from '@/components/table/DataTable';
import { FormAlert } from '@/features/auth/components/FormAlert';
import { PageLink } from '@/features/search-console/components/reports/cells';
import { useListParams } from '@/hooks/useListParams';
import { cn } from '@/lib/utils';
import { getApiErrorMessage } from '@/utils/formErrorHandler';
import { useCannibalisation } from '../../hooks/useRankTracking';
import type { CannibalisedRow } from '../../types';
import { DeviceIcon, Rank } from '../cells';

const columns = (onOpen: (row: CannibalisedRow) => void): DataColumn<CannibalisedRow, string>[] => [
  {
    label: 'Keyword',
    skeleton: 'w-40',
    cell: (r) => (
      <button type="button" onClick={() => onOpen(r)} className="max-w-64 truncate text-left text-sm font-medium hover:text-primary hover:underline">
        {r.keyword}
      </button>
    ),
  },
  {
    label: 'Where',
    skeleton: 'w-28',
    cell: (r) => (
      <span className="flex items-center gap-1.5 text-sm">
        <span className="truncate">{r.locationName}</span>
        <DeviceIcon device={r.device} />
      </span>
    ),
  },
  {
    label: 'Competing pages',
    skeleton: 'w-64',
    wideOnCard: true,
    cell: (r) => {
      const sorted = [...r.urls].sort((a, b) => a.position - b.position);
      return (
        <ol className="space-y-1" aria-label={`${sorted.length} pages ranking for ${r.keyword}`}>
          {sorted.map((u, i) => (
            <li key={u.url} className="flex min-w-0 items-center gap-2">
              <span className={cn('inline-flex w-9 shrink-0 justify-center rounded px-1 py-px text-xs tabular-nums', i === 0 ? 'bg-ok-soft text-ok' : 'bg-muted text-muted-foreground')}>
                <Rank position={u.position} className="font-semibold" />
              </span>
              <PageLink url={u.url} className="min-w-0 max-w-md" />
            </li>
          ))}
        </ol>
      );
    },
  },
];

function Explainer() {
  return (
    <section className="flex gap-3 rounded border bg-card p-4 shadow-xs" aria-labelledby="cannibal-explainer-title">
      <Lightbulb className="mt-0.5 size-5 shrink-0 text-warn" aria-hidden />
      <div className="space-y-1.5 text-sm">
        <h2 id="cannibal-explainer-title" className="font-semibold">
          What is keyword cannibalisation?
        </h2>
        <p className="text-muted-foreground">
          Two or more of the site's pages show up for the same search. Google has to guess which one to rank, so they split links and clicks, and often both rank lower than one strong page
          would.
        </p>
        <p>
          <span className="font-medium">How to fix it:</span> pick one page for this search; merge or differentiate the other, and point internal links at the one you keep.
        </p>
      </div>
    </section>
  );
}

/** Keywords where two or more of the site's URLs rank, each URL with its position (best first). */
export function CannibalisationTab({ siteId, onOpen }: { siteId: number; onOpen: (row: CannibalisedRow) => void }) {
  const list = useListParams();
  const query = useCannibalisation(siteId, { page: list.page, perPage: list.perPage });
  const rows = query.data?.data ?? [];
  const meta = query.data?.meta;
  const cols = columns(onOpen);

  return (
    <div className="space-y-3">
      <Explainer />
      {query.isError ? (
        <FormAlert tone="error">
          <p>{getApiErrorMessage(query.error, 'We could not load the competing pages.')}</p>
          <p>
            <button type="button" className="font-medium underline" onClick={() => query.refetch()}>
              Try again
            </button>
          </p>
        </FormAlert>
      ) : query.isPending ? (
        <DataTableSkeleton columns={cols} label="Loading the competing pages" selectable={false} actions={false} />
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded border border-dashed bg-card px-6 py-12 text-center">
          <CheckCircle2 className="size-6 text-ok" aria-hidden />
          <p className="text-sm font-medium">No cannibalisation found</p>
          <p className="max-w-md text-sm text-muted-foreground">On the latest checks, each tracked keyword has at most one of the site's pages ranking for it.</p>
        </div>
      ) : (
        <div className={cn('transition-opacity', query.isFetching && 'opacity-60')}>
          <DataTable rows={rows} columns={cols} rowLabel={(r) => r.keyword} noun="keywords" onRowClick={onOpen} />
          {meta && (
            <Paginator currentPage={meta.currentPage} lastPage={meta.lastPage} totalItems={meta.total} perPage={meta.perPage} onPageChange={list.onPageChange} onPerPageChange={list.onPerPageChange} />
          )}
        </div>
      )}
    </div>
  );
}
