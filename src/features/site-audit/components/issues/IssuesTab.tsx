import { useState } from 'react';
import { CheckCircle2, ChevronRight, Lightbulb, Search, SearchX, Wrench } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Paginator } from '@/components/Paginator';
import { DataTable, DataTableSkeleton, type DataColumn } from '@/components/table/DataTable';
import { FormAlert } from '@/features/auth/components/FormAlert';
import { PageLink } from '@/features/search-console/components/reports/cells';
import { formatNumber } from '@/features/search-console/lib/format';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { cn } from '@/lib/utils';
import { DEFAULT_PER_PAGE } from '@/types/pagination';
import { getApiErrorMessage } from '@/utils/formErrorHandler';
import { useAffectedUrls, useIssueGroups } from '../../hooks/useSiteAudit';
import { SEVERITIES, SEVERITY } from '../../lib/severity';
import type { AffectedUrl, IssueGroup } from '../../types';
import { NewBadge, SeverityBadge } from '../SeverityBadge';
import { IssueDetails } from './IssueDetails';

/**
 * The audit's issues, grouped critical → warning → notice. Each issue type
 * opens to explain why it matters and how to fix it (in plain English) above
 * the URLs it affects.
 */
export function IssuesTab({ auditId }: { auditId: number }) {
  const groups = useIssueGroups(auditId);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const toggle = (type: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });

  if (groups.isError) {
    return (
      <FormAlert tone="error">
        <p>{getApiErrorMessage(groups.error, 'We could not load the issues.')}</p>
        <p>
          <button type="button" className="font-medium underline" onClick={() => groups.refetch()}>
            Try again
          </button>
        </p>
      </FormAlert>
    );
  }
  if (groups.isPending) return <IssuesSkeleton />;
  if (groups.data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded border bg-card px-6 py-12 text-center shadow-xs">
        <span className="grid size-10 place-items-center rounded-full bg-ok-soft text-ok">
          <CheckCircle2 className="size-5" aria-hidden />
        </span>
        <p className="text-sm font-semibold">No issues found</p>
        <p className="max-w-md text-sm text-muted-foreground">Every page we crawled passed every check. Keep audits on a schedule to catch new problems early.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {SEVERITIES.map((severity) => {
        const list = groups.data.filter((g) => g.severity === severity).sort((a, b) => b.count - a.count);
        if (list.length === 0) return null;
        const s = SEVERITY[severity];
        const urls = list.reduce((n, g) => n + g.count, 0);
        return (
          <section key={severity} aria-labelledby={`issues-${severity}`} className="space-y-1.5">
            <h3 id={`issues-${severity}`} className="flex items-baseline gap-2 text-sm font-semibold">
              <span className={s.text}>{s.plural}</span>
              <span className="text-xs font-normal text-muted-foreground">
                {list.length} {list.length === 1 ? 'type' : 'types'} · {formatNumber(urls)} affected {urls === 1 ? 'URL' : 'URLs'} · {s.hint.toLowerCase()}
              </span>
            </h3>
            <ul className="divide-y overflow-hidden rounded border bg-card shadow-xs">
              {list.map((group) => (
                <IssueRow key={group.type} auditId={auditId} group={group} open={open.has(group.type)} onToggle={() => toggle(group.type)} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function IssueRow({ auditId, group, open, onToggle }: { auditId: number; group: IssueGroup; open: boolean; onToggle: () => void }) {
  const panelId = `issue-${group.type}`;
  return (
    <li className={cn(open && 'bg-muted/20')}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent/40 focus-visible:bg-accent/40 focus-visible:outline-none"
      >
        <ChevronRight className={cn('size-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-90')} aria-hidden />
        <SeverityBadge severity={group.severity} className="hidden sm:inline-flex" />
        <span className="min-w-0 flex-1 text-sm font-medium text-foreground">{group.title}</span>
        {group.newCount > 0 && <NewBadge count={group.newCount} />}
        <span className="min-w-12 text-right text-sm font-semibold tabular-nums" aria-label={`${group.count} affected`}>
          {formatNumber(group.count)}
        </span>
      </button>
      {open && (
        <div id={panelId} className="space-y-3 border-t bg-card px-3 pb-4 pt-3 sm:pl-10">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded border bg-background/60 p-3">
              <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Lightbulb className="size-3.5 text-warn" aria-hidden />
                Why it matters
              </p>
              <p className="mt-1 text-sm text-foreground">{group.why}</p>
            </div>
            <div className="rounded border bg-background/60 p-3">
              <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Wrench className="size-3.5 text-primary" aria-hidden />
                How to fix
              </p>
              <p className="mt-1 whitespace-pre-line text-sm text-foreground">{group.howToFix}</p>
            </div>
          </div>
          <AffectedUrls auditId={auditId} group={group} />
        </div>
      )}
    </li>
  );
}

type AffectedRow = AffectedUrl & { id: number };

const columns: DataColumn<AffectedRow, string>[] = [
  {
    label: 'URL',
    skeleton: 'w-56',
    cell: (r) => (
      <span className="flex min-w-0 items-center gap-2">
        <PageLink url={r.url} className="max-w-md" />
        {r.isNew && <NewBadge />}
      </span>
    ),
  },
  { label: 'Details', skeleton: 'w-64', wideOnCard: true, cell: (r) => <IssueDetails details={r.details} fallback="—" /> },
];

/** The URLs one issue affects, 15 a page, searchable when there are many. */
function AffectedUrls({ auditId, group }: { auditId: number; group: IssueGroup }) {
  const [paging, setPaging] = useState({ page: 1, perPage: DEFAULT_PER_PAGE });
  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput.trim(), 350);
  const [lastSearch, setLastSearch] = useState(search);
  if (search !== lastSearch) {
    setLastSearch(search);
    setPaging((p) => ({ ...p, page: 1 }));
  }
  const query = useAffectedUrls(auditId, group.type, { ...paging, search: search || undefined });
  const rows = query.data?.data ?? [];
  const meta = query.data?.meta;

  return (
    <div className="space-y-2">
      {group.count > DEFAULT_PER_PAGE && (
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search URLs"
            aria-label={`Search URLs with ${group.title.toLowerCase()}`}
            className="h-8 bg-card pl-9"
          />
        </div>
      )}
      {query.isError ? (
        <FormAlert tone="error">
          <p>{getApiErrorMessage(query.error, 'We could not load the affected URLs.')}</p>
        </FormAlert>
      ) : query.isPending ? (
        <DataTableSkeleton columns={columns} label="Loading the affected URLs" selectable={false} actions={false} rows={3} />
      ) : rows.length === 0 ? (
        <p className="flex items-center gap-2 rounded border border-dashed px-3 py-4 text-sm text-muted-foreground">
          <SearchX className="size-4" aria-hidden />
          {search ? `No URLs match “${search}”.` : 'No URLs to show.'}
        </p>
      ) : (
        <div className={cn('transition-opacity', query.isFetching && 'opacity-60')}>
          <DataTable rows={rows} columns={columns} rowLabel={(r) => r.url} noun="URLs" />
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
  );
}

function IssuesSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading the issues">
      {[3, 2].map((n, s) => (
        <div key={s} className="space-y-1.5">
          <Skeleton className="h-4 w-56 rounded" />
          <div className="divide-y rounded border bg-card">
            {Array.from({ length: n }, (_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-3">
                <Skeleton className="size-4 rounded" />
                <Skeleton className="h-5 w-16 rounded" />
                <Skeleton className={cn('h-3.5 rounded', ['w-48', 'w-64', 'w-40'][i])} />
                <Skeleton className="ml-auto h-3.5 w-8 rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
