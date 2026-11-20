import { useState } from 'react';
import { CheckCircle2, GitCompareArrows, SearchX } from 'lucide-react';
import { SheetCloseFooter } from '@/components/form/SheetCloseFooter';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Segmented } from '@/components/form/Segmented';
import { Paginator } from '@/components/Paginator';
import { DataTable, DataTableSkeleton, type DataColumn } from '@/components/table/DataTable';
import { FormAlert } from '@/features/auth/components/FormAlert';
import { PageLink } from '@/features/search-console/components/reports/cells';
import { formatNumber } from '@/features/search-console/lib/format';
import { cn } from '@/lib/utils';
import { DEFAULT_PER_PAGE } from '@/types/pagination';
import { formatDate } from '@/utils/formatDate';
import { getApiErrorMessage } from '@/utils/formErrorHandler';
import { useComparison } from '../hooks/useSiteAudit';
import type { AuditComparison, ChangeFilter, ComparisonRow } from '../types';
import { SeverityBadge } from './SeverityBadge';
import { IssueDetails } from './issues/IssueDetails';

/** "12 fixed · 3 new" for tables; "First audit" when there is nothing to compare with. */
export function ComparisonChip({ comparison }: { comparison: AuditComparison | null }) {
  if (!comparison) return <span className="text-xs text-muted-foreground">First audit</span>;
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded border bg-background/60 px-1.5 py-0.5 text-xs font-medium tabular-nums">
      <span className={comparison.fixed > 0 ? 'text-ok' : 'text-muted-foreground'}>{formatNumber(comparison.fixed)} fixed</span>
      <span className="text-muted-foreground" aria-hidden>
        ·
      </span>
      <span className={comparison.new > 0 ? 'text-bad' : 'text-muted-foreground'}>{formatNumber(comparison.new)} new</span>
    </span>
  );
}

const plural = (n: number, one: string, many = `${one}s`) => `${formatNumber(n)} ${n === 1 ? one : many}`;

/**
 * "12 issues fixed, 3 new since 14/11/2026": each figure opens the list of
 * what changed.
 */
export function ComparisonBanner({ comparison, previousDate, onOpen }: { comparison: AuditComparison; previousDate?: string | null; onOpen: (filter: ChangeFilter) => void }) {
  const since = previousDate ? `since ${formatDate(previousDate)}` : 'since the previous audit';
  const improved = comparison.fixed >= comparison.new;
  const link = 'rounded font-semibold underline decoration-dotted underline-offset-2 hover:decoration-solid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
  return (
    <section aria-label="Compared with the previous audit" className="relative flex flex-wrap items-center gap-x-3 gap-y-1 overflow-hidden rounded border bg-card py-2.5 pl-5 pr-4 shadow-xs">
      <span aria-hidden className={cn('absolute inset-y-0 left-0 w-1', improved ? 'bg-ok' : 'bg-warn')} />
      <span aria-hidden className={cn('grid size-7 place-items-center rounded', improved ? 'bg-ok-soft text-ok' : 'bg-warn-soft text-warn')}>
        {improved ? <CheckCircle2 className="size-4" /> : <GitCompareArrows className="size-4" />}
      </span>
      <p className="text-sm text-foreground" data-testid="comparison-text">
        {comparison.fixed === 0 && comparison.new === 0 ? (
          <>No issues fixed or new {since}.</>
        ) : (
          <>
            <button type="button" className={cn(link, 'text-ok')} onClick={() => onOpen('fixed')} disabled={comparison.fixed === 0}>
              {plural(comparison.fixed, 'issue')} fixed
            </button>
            ,{' '}
            <button type="button" className={cn(link, 'text-bad')} onClick={() => onOpen('new')} disabled={comparison.new === 0}>
              {formatNumber(comparison.new)} new
            </button>{' '}
            {since}.
          </>
        )}
      </p>
      <p className="text-xs text-muted-foreground sm:ml-auto">{plural(comparison.persisting, 'issue')} still open</p>
    </section>
  );
}

const columns: DataColumn<ComparisonRow & { id: number }, string>[] = [
  { label: 'Page', skeleton: 'w-48', cell: (r) => <PageLink url={r.url} className="max-w-72" /> },
  { label: 'Issue', skeleton: 'w-40', cell: (r) => <span className="text-sm">{r.title}</span> },
  { label: 'Severity', skeleton: 'w-16', cell: (r) => <SeverityBadge severity={r.severity} /> },
  { label: 'Details', skeleton: 'w-40', wideOnCard: true, cell: (r) => <IssueDetails details={r.details} fallback="—" /> },
];

interface SheetProps {
  auditId: number;
  comparison: AuditComparison;
  previousDate?: string | null;
  filter: ChangeFilter | null;
  onFilterChange: (filter: ChangeFilter | null) => void;
}

/** What changed since the previous audit, fixed or new, one issue on one page per row. */
export function ComparisonSheet({ auditId, comparison, previousDate, filter, onFilterChange }: SheetProps) {
  const [paging, setPaging] = useState({ page: 1, perPage: DEFAULT_PER_PAGE });
  const open = filter !== null;
  const query = useComparison(auditId, filter ?? 'fixed', paging, open);
  const rows = query.data?.data ?? [];
  const meta = query.data?.meta;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onFilterChange(null)}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-2xl">
        <SheetHeader className="border-b">
          <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Compared with the previous audit</p>
          <SheetTitle className="text-lg">Changes {previousDate ? `since ${formatDate(previousDate)}` : 'since the previous audit'}</SheetTitle>
          <SheetDescription>Fixed: found last time and gone now. New: not there last time.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          <Segmented
            label="Show"
            value={filter ?? 'fixed'}
            onChange={(f) => {
              setPaging((p) => ({ ...p, page: 1 }));
              onFilterChange(f);
            }}
            options={[
              ['fixed', 'Fixed', comparison.fixed, 'ok'],
              ['new', 'New', comparison.new, 'bad'],
            ]}
          />
          {query.isError ? (
            <FormAlert tone="error">
              <p>{getApiErrorMessage(query.error, 'We could not load the changes.')}</p>
            </FormAlert>
          ) : query.isPending ? (
            <DataTableSkeleton columns={columns} label="Loading the changes" selectable={false} actions={false} rows={5} />
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded border border-dashed bg-card px-6 py-10 text-center">
              <SearchX className="size-6 text-muted-foreground" aria-hidden />
              <p className="text-sm text-muted-foreground">{filter === 'new' ? 'No new issues.' : 'Nothing was fixed since the previous audit.'}</p>
            </div>
          ) : (
            <div className={cn('transition-opacity', query.isFetching && 'opacity-60')}>
              <DataTable rows={rows} columns={columns} rowLabel={(r) => `${r.title} on ${r.url}`} noun="changes" />
              {meta && (
                <Paginator
                  currentPage={meta.currentPage}
                  lastPage={meta.lastPage}
                  totalItems={meta.total}
                  perPage={meta.perPage}
                  onPageChange={(page) => setPaging((p) => ({ ...p, page }))}
                  onPerPageChange={(perPage) => setPaging({ page: 1, perPage })}
                />
              )}
            </div>
          )}
        </div>
        <SheetCloseFooter />
      </SheetContent>
    </Sheet>
  );
}
