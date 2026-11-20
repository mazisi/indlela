import { useState } from 'react';
import { Search, SearchX } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Paginator } from '@/components/Paginator';
import { DataTable, DataTableSkeleton, type DataColumn } from '@/components/table/DataTable';
import { FormAlert } from '@/features/auth/components/FormAlert';
import { formatNumber, pagePath } from '@/features/search-console/lib/format';
import { useListParams } from '@/hooks/useListParams';
import { useUrlSort } from '@/hooks/useUrlSort';
import { cn } from '@/lib/utils';
import { getApiErrorMessage } from '@/utils/formErrorHandler';
import { useCrawledPages } from '../../hooks/useSiteAudit';
import { PAGE_SORT_KEYS, type CrawledPage, type PageSortKey, type StatusClass } from '../../types';
import { StatusCode } from '../issues/IssueDetails';
import { IndexableBadge } from './IndexableBadge';
import { PageDetailSheet } from './PageDetailSheet';

const STATUS_OPTIONS: { value: StatusClass; label: string }[] = [
  { value: '2xx', label: '2xx · OK' },
  { value: '3xx', label: '3xx · Redirect' },
  { value: '4xx', label: '4xx · Not found' },
  { value: '5xx', label: '5xx · Server error' },
];

const isStatus = (v: string | null): v is StatusClass => STATUS_OPTIONS.some((o) => o.value === v);

const number = (n: number | null) => <span className="tabular-nums">{formatNumber(n)}</span>;

/** The page cell is a button too, so keyboard users can open the details. */
const pageColumns = (onOpen: (page: CrawledPage) => void): DataColumn<CrawledPage, PageSortKey>[] => [
  {
    label: 'Page',
    sortKey: 'url',
    skeleton: 'w-56',
    cell: (p) => (
      <span className="block min-w-0 max-w-md">
        <button type="button" onClick={() => onOpen(p)} className="block max-w-full truncate rounded text-left font-mono text-xs text-primary hover:underline" title={p.url}>
          {pagePath(p.url)}
        </button>
        <span className={cn('block truncate text-xs', p.title ? 'text-muted-foreground' : 'italic text-muted-foreground/70')}>{p.title || 'No title'}</span>
      </span>
    ),
  },
  { label: 'Status', sortKey: 'status_code', skeleton: 'w-10', cell: (p) => <StatusCode code={p.statusCode} /> },
  { label: 'Indexable', skeleton: 'w-16', cell: (p) => <IndexableBadge indexable={p.isIndexable} /> },
  { label: 'Depth', sortKey: 'depth', align: 'right', skeleton: 'w-6', cell: (p) => number(p.depth) },
  { label: 'Inlinks', sortKey: 'inlinks_count', align: 'right', skeleton: 'w-8', cell: (p) => number(p.inlinksCount) },
  { label: 'Words', sortKey: 'word_count', align: 'right', skeleton: 'w-10', cell: (p) => number(p.wordCount) },
  {
    label: 'Response',
    sortKey: 'response_ms',
    align: 'right',
    skeleton: 'w-12',
    cell: (p) => <span className="tabular-nums">{p.responseMs === null ? '—' : `${formatNumber(p.responseMs)} ms`}</span>,
  },
  {
    label: 'Issues',
    align: 'right',
    skeleton: 'w-6',
    cell: (p) => <span className={cn('tabular-nums font-semibold', p.issuesCount > 0 ? 'text-foreground' : 'text-muted-foreground')}>{formatNumber(p.issuesCount)}</span>,
  },
];

/** Every crawled page: search, status and indexable filters, sorting (all in the URL); a row opens the page's details. */
export function PagesTab({ auditId }: { auditId: number }) {
  const list = useListParams();
  const { sort, onSort } = useUrlSort(PAGE_SORT_KEYS);
  const [openId, setOpenId] = useState<number>();
  const columns = pageColumns((p) => setOpenId(p.id));
  const statusParam = list.params.get('status');
  const status = isStatus(statusParam) ? statusParam : undefined;
  const indexableParam = list.params.get('indexable');
  const indexable = indexableParam === '1' ? true : indexableParam === '0' ? false : undefined;

  const query = useCrawledPages(auditId, {
    page: list.page,
    perPage: list.perPage,
    search: list.search,
    status,
    indexable,
    sort: sort ? `${sort.direction === 'desc' ? '-' : ''}${sort.key}` : undefined,
  });
  const rows = query.data?.data ?? [];
  const meta = query.data?.meta;
  const filtered = Boolean(list.search || status || indexable !== undefined);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            value={list.searchInput}
            onChange={(e) => list.setSearchInput(e.target.value)}
            placeholder="Search URL or title"
            aria-label="Search pages"
            className="bg-card pl-9"
          />
        </div>
        <Select value={status ?? 'all'} onValueChange={(v) => list.update({ status: v === 'all' ? undefined : v, page: undefined })}>
          <SelectTrigger aria-label="Status" className="h-9 w-44 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={indexableParam === '1' || indexableParam === '0' ? indexableParam : 'all'} onValueChange={(v) => list.update({ indexable: v === 'all' ? undefined : v, page: undefined })}>
          <SelectTrigger aria-label="Indexable" className="h-9 w-44 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Indexable or not</SelectItem>
            <SelectItem value="1">Indexable</SelectItem>
            <SelectItem value="0">Not indexable</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {query.isError ? (
        <FormAlert tone="error">
          <p>{getApiErrorMessage(query.error, 'We could not load the crawled pages.')}</p>
          <p>
            <button type="button" className="font-medium underline" onClick={() => query.refetch()}>
              Try again
            </button>
          </p>
        </FormAlert>
      ) : query.isPending ? (
        <DataTableSkeleton columns={columns} label="Loading the crawled pages" selectable={false} actions={false} />
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded border border-dashed bg-card px-6 py-12 text-center">
          <SearchX className="size-6 text-muted-foreground" aria-hidden />
          <p className="text-sm font-medium">{filtered ? 'No pages match these filters' : 'No pages were crawled'}</p>
          <p className="max-w-md text-sm text-muted-foreground">{filtered ? 'Try a different search or clear a filter.' : 'The crawler could not read any page on the site.'}</p>
        </div>
      ) : (
        <div className={cn('transition-opacity', query.isFetching && 'opacity-60')} aria-busy={query.isFetching || undefined}>
          <DataTable rows={rows} columns={columns} rowLabel={(p) => p.url} noun="pages" sort={sort} onSort={onSort} onRowClick={(p) => setOpenId(p.id)} />
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

      <PageDetailSheet auditId={auditId} pageId={openId} onClose={() => setOpenId(undefined)} />
    </div>
  );
}
