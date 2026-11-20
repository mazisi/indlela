import { useState } from 'react';
import { CalendarClock, ChevronDown, Loader2, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Paginator } from '@/components/Paginator';
import { ActiveBulkBar } from '@/components/table/ActiveBulkBar';
import { DataTable, DataTableSkeleton } from '@/components/table/DataTable';
import { FormAlert } from '@/features/auth/components/FormAlert';
import { useListParams } from '@/hooks/useListParams';
import { useRowSelection } from '@/hooks/useRowSelection';
import { useUrlSort } from '@/hooks/useUrlSort';
import { cn } from '@/lib/utils';
import showToaster from '@/utils/showToaster';
import { getApiErrorMessage } from '@/utils/formErrorHandler';
import { useCheckNow } from '../../hooks/useCheckNow';
import { useBulkKeywords, useDeleteKeyword, useKeywords, useRankUsage } from '../../hooks/useRankTracking';
import { checkNowBlocked, checksNowLeft } from '../../lib/usage';
import { DEVICE_LABEL, FREQUENCY_LABEL, isBucket, isDevice } from '../../lib/position';
import { KEYWORD_SORT_KEYS, type BulkAction, type Frequency, type RankKeyword } from '../../types';
import { CheckNowButton } from './CheckNowButton';
import { EditKeywordSheet } from './EditKeywordSheet';
import { KeywordFilters } from './KeywordFilters';
import { keywordColumns } from './keywordColumns';

interface Props {
  siteId: number;
  canManage: boolean;
  /** Filter options from the summary, when the API sends them. */
  locations?: string[];
  tags?: string[];
  onOpen: (keyword: RankKeyword) => void;
}

const unique = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b));
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

const BULK_DONE: Record<BulkAction, string> = { activate: 'resumed', deactivate: 'paused', delete: 'deleted', set_frequency: 'updated' };

/**
 * A site's tracked keywords: server-paginated, with search, device, location,
 * tag and position filters and sorting in the URL. Managers get row
 * selection (activate, pause, set frequency, delete), Check now, edit and
 * delete; a row opens the keyword's history.
 */
export function KeywordsTab({ siteId, canManage, locations, tags, onOpen }: Props) {
  const list = useListParams();
  const { sort, onSort } = useUrlSort(KEYWORD_SORT_KEYS);
  const p = list.params;
  const device = isDevice(p.get('device')) ? (p.get('device') as RankKeyword['device']) : undefined;
  const bucketParam = p.get('bucket');
  const bucket = isBucket(bucketParam) ? bucketParam : undefined;
  const location = p.get('location') ?? undefined;
  const tag = p.get('tag') ?? undefined;

  const query = useKeywords(siteId, { page: list.page, perPage: list.perPage, search: list.search, device, location, tag, bucket, sort });
  const rows = query.data?.data ?? [];
  const meta = query.data?.meta;
  const filtered = Boolean(list.search || device || location || tag || bucket);

  const selection = useRowSelection(
    rows.map((r) => r.id),
    [list.page, list.perPage, list.search, device, location, tag, bucket, sort?.key, sort?.direction].join('|'),
  );
  const bulk = useBulkKeywords(siteId);
  const remove = useDeleteKeyword(siteId);
  const checkNow = useCheckNow(siteId, query.data?.data);
  const usage = useRankUsage();
  const blocked = checkNowBlocked(usage.data);

  const [editing, setEditing] = useState<RankKeyword>();
  const [deleting, setDeleting] = useState<RankKeyword>();
  const [checking, setChecking] = useState<RankKeyword>();
  const [bulkDelete, setBulkDelete] = useState(false);

  const runBulk = (action: BulkAction, frequency?: Frequency) => {
    const ids = selection.ids;
    bulk.mutate(
      { action, ids, frequency },
      {
        onSuccess: () => {
          showToaster('success', `${plural(ids.length, 'keyword')} ${frequency ? `set to ${FREQUENCY_LABEL[frequency].toLowerCase()} checks` : BULK_DONE[action]}.`);
          selection.clear();
          setBulkDelete(false);
        },
        onError: (error) => showToaster('error', getApiErrorMessage(error, 'Could not update the keywords.')),
      },
    );
  };

  const confirmDelete = () =>
    deleting &&
    remove.mutate(deleting.id, {
      onSuccess: () => {
        showToaster('success', `“${deleting.keyword}” is no longer tracked.`);
        setDeleting(undefined);
      },
      onError: (error) => showToaster('error', getApiErrorMessage(error, 'Could not delete the keyword.')),
    });

  const columns = keywordColumns(onOpen);
  const optionsFrom = (pick: (r: RankKeyword) => string[]) => unique(rows.flatMap(pick));

  return (
    <div className="space-y-3">
      <KeywordFilters
        searchInput={list.searchInput}
        onSearchInput={list.setSearchInput}
        device={device}
        location={location}
        tag={tag}
        bucket={bucket}
        locations={locations ?? optionsFrom((r) => [r.location.name])}
        tags={tags ?? optionsFrom((r) => r.tags)}
        onFilter={(key, value) => list.update({ [key]: value, page: undefined })}
      />

      {canManage && selection.count > 0 && (
        <ActiveBulkBar
          count={selection.count}
          canUpdate
          canDelete
          pending={bulk.isPending ? (bulk.variables?.action === 'set_frequency' ? undefined : bulk.variables?.action) : undefined}
          onAction={(action) => (action === 'delete' ? setBulkDelete(true) : runBulk(action))}
          onClear={selection.clear}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={bulk.isPending}>
                {bulk.isPending && bulk.variables?.action === 'set_frequency' ? <Loader2 className="animate-spin" /> : <CalendarClock />}
                Set frequency
                <ChevronDown className="opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(['daily', 'weekly'] as const).map((f) => (
                <DropdownMenuItem key={f} onSelect={() => runBulk('set_frequency', f)}>
                  {FREQUENCY_LABEL[f]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </ActiveBulkBar>
      )}

      {query.isError ? (
        <FormAlert tone="error">
          <p>{getApiErrorMessage(query.error, 'We could not load the keywords.')}</p>
          <p>
            <button type="button" className="font-medium underline" onClick={() => query.refetch()}>
              Try again
            </button>
          </p>
        </FormAlert>
      ) : query.isPending ? (
        <DataTableSkeleton columns={columns} label="Loading the keywords" selectable={canManage} actions={canManage} />
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded border border-dashed bg-card px-6 py-12 text-center">
          <SearchX className="size-6 text-muted-foreground" aria-hidden />
          <p className="text-sm font-medium">{filtered ? 'No keywords match these filters' : 'No keywords tracked'}</p>
          <p className="max-w-md text-sm text-muted-foreground">{filtered ? 'Try a different search or clear a filter.' : 'Add keywords to start tracking this site.'}</p>
        </div>
      ) : (
        <div className={cn('transition-opacity', query.isFetching && !query.isRefetching && 'opacity-60')}>
          <DataTable
            rows={rows}
            columns={columns}
            rowLabel={(k) => `${k.keyword} (${k.location.name}, ${DEVICE_LABEL[k.device]})`}
            noun="keywords"
            sort={sort}
            onSort={onSort}
            muted={(k) => !k.isActive}
            onRowClick={onOpen}
            actions={
              canManage
                ? {
                    selection,
                    onEdit: setEditing,
                    onDelete: setDeleting,
                    extra: (k) => <CheckNowButton keyword={k} blocked={blocked} busy={checkNow.checking === k.id} onCheck={setChecking} />,
                  }
                : undefined
            }
          />
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

      {canManage && (
        <>
          <EditKeywordSheet siteId={siteId} keyword={editing} onClose={() => setEditing(undefined)} />
          <ConfirmationDialog
            open={Boolean(checking)}
            onOpenChange={(o) => !o && setChecking(undefined)}
            title="Check now"
            description={
              checking && (
                <>
                  Check this keyword's position now?
                  {usage.data && ` You have ${checksNowLeft(usage.data)} of ${usage.data.checkNowLimit} instant checks left today.`}
                  <span className="mt-2 block text-xs">
                    “{checking.keyword}” · {checking.location.name} · {DEVICE_LABEL[checking.device]}. The result usually lands within a minute.
                  </span>
                </>
              )
            }
            confirmLabel="Check now"
            isLoading={checkNow.checking !== undefined}
            onConfirm={() => checking && checkNow.run(checking, () => setChecking(undefined))}
          />
          <ConfirmationDialog
            open={Boolean(deleting)}
            onOpenChange={(o) => !o && setDeleting(undefined)}
            title="Stop tracking this keyword?"
            description={deleting && `“${deleting.keyword}” (${deleting.location.name}, ${DEVICE_LABEL[deleting.device].toLowerCase()}) stops being checked and leaves the list and reports.`}
            confirmLabel="Delete"
            variant="danger"
            isLoading={remove.isPending}
            onConfirm={confirmDelete}
          />
          <ConfirmationDialog
            open={bulkDelete}
            onOpenChange={setBulkDelete}
            title={`Delete ${plural(selection.count, 'keyword')}?`}
            description="They stop being checked and leave the list and reports. To keep them in the list without checks, pause them instead."
            confirmLabel="Delete"
            variant="danger"
            isLoading={bulk.isPending}
            onConfirm={() => runBulk('delete')}
          />
        </>
      )}
    </div>
  );
}
