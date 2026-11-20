import { Info, Lightbulb, Search, SearchX } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Paginator } from '@/components/Paginator';
import { DataTable, DataTableSkeleton, type DataColumn } from '@/components/table/DataTable';
import { FormAlert } from '@/features/auth/components/FormAlert';
import { useListParams } from '@/hooks/useListParams';
import { useUrlSort } from '@/hooks/useUrlSort';
import { cn } from '@/lib/utils';
import { getApiErrorMessage } from '@/utils/formErrorHandler';
import { useReport } from '../../hooks/useSearchConsole';
import type { ReportKey, ReportRows, ReportScope } from '../../types';
import { REPORTS } from './reportConfig';

/**
 * One report tab: its explainer, a search box, and the server-paginated
 * table (15 a page). Page, search and sort live in the URL; mount it keyed
 * by report so the search box starts fresh on every tab.
 */
export function ReportPanel<K extends ReportKey>({ report, scope }: { report: K; scope: ReportScope }) {
  const config = REPORTS[report];
  const list = useListParams();
  const { sort, onSort } = useUrlSort(config.sortKeys);
  const query = useReport(report, {
    ...scope,
    ...(config.fixedRange ? { start: undefined, end: undefined } : {}),
    page: list.page,
    perPage: list.perPage,
    search: list.search,
    sort,
  });
  const rows = (query.data?.data ?? []) as ReportRows[K][];
  const meta = query.data?.meta;
  const columns = config.columns as DataColumn<ReportRows[K], string>[];

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <p className="flex items-start gap-2 text-sm text-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          {config.explainer}
        </p>
        {config.tip && (
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-warn" aria-hidden />
            {config.tip}
          </p>
        )}
      </div>

      <div className="relative sm:w-80">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          type="search"
          value={list.searchInput}
          onChange={(e) => list.setSearchInput(e.target.value)}
          placeholder={config.searchLabel}
          aria-label={config.searchLabel}
          className="bg-card pl-9"
        />
      </div>

      {query.isError ? (
        <FormAlert tone="error">
          <p>{getApiErrorMessage(query.error, 'We could not load this report.')}</p>
          <p>
            <button type="button" className="font-medium underline" onClick={() => query.refetch()}>
              Try again
            </button>
          </p>
        </FormAlert>
      ) : query.isPending ? (
        <DataTableSkeleton columns={columns} label={`Loading ${config.noun}`} selectable={false} actions={false} />
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded border border-dashed bg-card px-6 py-12 text-center">
          <SearchX className="size-6 text-muted-foreground" aria-hidden />
          <p className="text-sm font-medium">{list.search ? `No ${config.noun} match “${list.search}”` : 'Nothing to show'}</p>
          <p className="max-w-md text-sm text-muted-foreground">{list.search ? 'Try a shorter or different search.' : config.empty}</p>
        </div>
      ) : (
        <div className={cn('transition-opacity', query.isFetching && 'opacity-60')} aria-busy={query.isFetching || undefined}>
          <DataTable rows={rows} columns={columns} rowLabel={config.rowLabel} noun={config.noun} sort={sort} onSort={config.sortKeys.length ? onSort : undefined} />
          {meta && (
            <Paginator
              currentPage={meta.currentPage}
              lastPage={meta.lastPage}
              totalItems={meta.total}
              perPage={meta.perPage}
              onPageChange={list.onPageChange}
              onPerPageChange={list.onPerPageChange}
            />
          )}
        </div>
      )}
    </div>
  );
}
