import { useState } from 'react';
import { History } from 'lucide-react';
import { Head } from '@/components/ui/Head';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { PageHeader } from '@/components/page/PageHeader';
import { Paginator } from '@/components/Paginator';
import { DataTable, DataTableSkeleton } from '@/components/table/DataTable';
import { useListParams } from '@/hooks/useListParams';
import { FormAlert } from '@/features/auth/components/FormAlert';
import showToaster from '@/utils/showToaster';
import { getApiErrorMessage } from '@/utils/formErrorHandler';
import { useChangeHistory, useChangeHistoryOptions, useUndoChange } from '../hooks/useChangeHistory';
import { historyColumns } from '../components/historyColumns';
import { HistoryFilters, type FilterValues } from '../components/HistoryFilters';
import { ChangeEntrySheet } from '../components/ChangeEntrySheet';
import { UndoButton } from '../components/UndoButton';
import { showValue, visibleChanges } from '../lib/format';
import type { ChangeAction, ChangeHistoryEntry, ChangeHistoryFilters } from '../types';

/** What Undo will do, in the confirmation. */
function undoDescription(e: ChangeHistoryEntry): string {
  const name = e.recordLabel ?? `#${e.recordId}`;
  if (e.action === 'delete') return `${e.recordType ?? 'The record'} “${name}” comes back as it was when it was removed.`;
  const fields = visibleChanges(e).map((c) => `${c.label} back to “${showValue(c.old)}”`);
  return `${name}: ${fields.length ? fields.join(', ') : 'the old values are put back'}. The undo is listed here too, and can itself be undone.`;
}

/**
 * Settings › Change history (ported from workforce, plus Undo): every change
 * in the workspace, newest first: who, when, and each field's old and new
 * value. The API limits it to the pages (and clients) the user may open, and
 * says per entry whether it can be undone. Clicking a row opens its drawer
 * with every field. Filters and page live in the URL.
 */
export default function ChangeHistoryPage() {
  const list = useListParams();
  const values: FilterValues = {
    module: list.params.get('module') ?? undefined,
    user: list.params.get('user') ?? undefined,
    action: list.params.get('action') ?? undefined,
    from: list.params.get('from') ?? undefined,
    to: list.params.get('to') ?? undefined,
  };
  const filters: ChangeHistoryFilters = {
    pageKey: values.module,
    user: values.user,
    action: values.action as ChangeAction | undefined,
    search: list.search,
    from: values.from,
    to: values.to,
  };

  const query = useChangeHistory({ ...filters, page: list.page, perPage: list.perPage });
  const options = useChangeHistoryOptions();
  const undo = useUndoChange();
  const [confirming, setConfirming] = useState<ChangeHistoryEntry>();
  const [open, setOpen] = useState<ChangeHistoryEntry>();
  const rows = query.data?.data ?? [];
  const meta = query.data?.meta;
  const filtered = Boolean(list.search || values.module || values.user || values.action || values.from || values.to);

  const runUndo = async () => {
    if (!confirming) return;
    try {
      const updated = await undo.mutateAsync(confirming.id);
      // The open drawer shows the entry as undone.
      if (open?.id === updated.id) setOpen(updated);
      showToaster('success', confirming.action === 'delete' ? `${confirming.recordLabel ?? 'The record'} is back.` : 'Change undone.');
    } catch (error) {
      showToaster('error', getApiErrorMessage(error, 'The change could not be undone.'));
    }
    setConfirming(undefined);
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <Head title="Change history" />
      <PageHeader
        eyebrow="Settings"
        title="Change history"
        description="Every change made in this workspace: who made it, when, and the old and new value of each field. Entries can't be edited or deleted; Undo puts a change back and is listed too. You see the pages and clients you have access to."
        actions={
          meta && (
            <span className="inline-flex items-center gap-2 rounded border bg-card px-3 py-1.5 text-sm font-medium">
              <History className="size-4 text-muted-foreground" aria-hidden />
              <span className="tabular-nums">{meta.total.toLocaleString('en-ZA')}</span>
              <span className="text-muted-foreground">{meta.total === 1 ? 'entry' : 'entries'}</span>
            </span>
          )
        }
      />

      <HistoryFilters
        searchInput={list.searchInput}
        onSearchInput={list.setSearchInput}
        values={values}
        options={options.data}
        onChange={(changes) => list.update({ ...changes, page: undefined })}
        onClear={
          filtered
            ? () => {
                // The search leaves the URL once the box's debounce catches up (setting both races it).
                list.setSearchInput('');
                list.update({ module: undefined, user: undefined, action: undefined, from: undefined, to: undefined, page: undefined });
              }
            : null
        }
      />

      {query.isError ? (
        <FormAlert tone="error">
          <p>{getApiErrorMessage(query.error, 'We could not load the change history.')}</p>
          <p>
            <button type="button" className="font-medium underline" onClick={() => query.refetch()}>
              Try again
            </button>
          </p>
        </FormAlert>
      ) : query.isPending ? (
        <DataTableSkeleton columns={historyColumns} label="Loading the change history" selectable={false} />
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded border border-dashed bg-card px-6 py-14 text-center">
          <History className="size-6 text-muted-foreground" aria-hidden />
          <p className="text-sm font-medium">{filtered ? 'No changes match these filters' : 'No changes yet'}</p>
          <p className="text-sm text-muted-foreground">
            {filtered ? 'Try another search, page, user or date.' : 'Records added, changed or removed on the pages you can open will be listed here.'}
          </p>
        </div>
      ) : (
        <div className={query.isFetching ? 'space-y-2 opacity-60 transition-opacity' : 'space-y-2 transition-opacity'}>
          <DataTable
            rows={rows}
            columns={historyColumns}
            noun="changes"
            rowLabel={(e) => `${e.recordLabel ?? e.recordId} ${e.action}`}
            rowClassName={(e) => (e.undoneAt ? 'opacity-70' : undefined)}
            onRowClick={setOpen}
            actions={{ extra: (e) => <UndoButton entry={e} busy={undo.isPending && undo.variables === e.id} onUndo={setConfirming} /> }}
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

      <ChangeEntrySheet entry={open} onClose={() => setOpen(undefined)} busy={undo.isPending && undo.variables === open?.id} onUndo={setConfirming} />

      <ConfirmationDialog
        open={Boolean(confirming)}
        onOpenChange={(o) => !o && !undo.isPending && setConfirming(undefined)}
        title={confirming?.action === 'delete' ? 'Bring it back?' : 'Undo this change?'}
        description={confirming ? undoDescription(confirming) : ''}
        confirmLabel="Undo"
        isLoading={undo.isPending}
        onConfirm={() => void runUndo()}
      />
    </div>
  );
}
