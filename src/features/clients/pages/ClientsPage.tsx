import { useState } from 'react';
import { Building2, Plus, Search, X } from 'lucide-react';
import { Head } from '@/components/ui/Head';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { PageHeader } from '@/components/page/PageHeader';
import { Paginator } from '@/components/Paginator';
import { ChangeHistorySheet } from '@/components/history/ChangeHistorySheet';
import { ActiveBulkBar, type ActiveBulkAction } from '@/components/table/ActiveBulkBar';
import { ActiveFilter, type ActiveFilterValue } from '@/components/table/ActiveFilter';
import { ActiveStatus } from '@/components/table/ActiveStatus';
import { DataTable, DataTableSkeleton } from '@/components/table/DataTable';
import { useListParams } from '@/hooks/useListParams';
import { useRowSelection } from '@/hooks/useRowSelection';
import { useUrlSort } from '@/hooks/useUrlSort';
import { usePermissions } from '@/contexts/PermissionContextType';
import { FormAlert } from '@/features/auth/components/FormAlert';
import showToaster from '@/utils/showToaster';
import { getApiErrorMessage } from '@/utils/formErrorHandler';
import { clientColumns } from '../components/clientColumns';
import { ClientFormSheet } from '../components/ClientFormSheet';
import { useBulkUpdateClients, useClientHistory, useClients, useDeleteClient } from '../hooks/useClients';
import { CLIENT_SORT_KEYS, type Client } from '../types';

const PAGE_TITLE = 'Clients';

const FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  contact_name: 'Contact person',
  contact_email: 'Contact email',
  notes: 'Notes',
  is_active: 'Active',
};

const BULK_DONE: Record<ActiveBulkAction, string> = { activate: 'activated', deactivate: 'deactivated', delete: 'deleted' };
const plural = (n: number) => `${n} ${n === 1 ? 'client' : 'clients'}`;
const STATUSES: ActiveFilterValue[] = ['active', 'inactive'];

/** A delete waiting for confirmation: one client, or the selection. */
type PendingDelete = { client: Client } | { bulk: number[] } | null;

/**
 * Clients › Clients: the businesses this workspace does SEO for. Users with
 * client access see only their clients (the API scopes the list). Search,
 * status, sort and page live in the URL.
 */
export default function ClientsPage() {
  const { hasPermission } = usePermissions();
  const can = {
    create: hasPermission('create_clients_clients'),
    update: hasPermission('update_clients_clients'),
    delete: hasPermission('delete_clients_clients'),
  };

  const list = useListParams();
  const { sort, onSort } = useUrlSort(CLIENT_SORT_KEYS);
  const status = STATUSES.find((s) => s === list.params.get('status'));
  const query = useClients({ page: list.page, perPage: list.perPage, search: list.search, status, sort });
  const clients = query.data?.data ?? [];
  const meta = query.data?.meta;
  const [historyPage, setHistoryPage] = useState(1);
  const history = useClientHistory(historyPage);

  const selection = useRowSelection(
    clients.map((c) => c.id),
    list.params.toString(),
  );
  const remove = useDeleteClient();
  const bulk = useBulkUpdateClients();

  const [drawer, setDrawer] = useState<{ open: boolean; client?: Client }>({ open: false });
  const [historyOpen, setHistoryOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);

  const runBulk = async (action: ActiveBulkAction, ids: number[]) => {
    try {
      const { affected } = await bulk.mutateAsync({ action, ids });
      showToaster('success', `${plural(affected)} ${BULK_DONE[action]}.`);
      selection.clear();
    } catch (error) {
      showToaster('error', getApiErrorMessage(error, 'Could not update the selected clients.'));
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    if ('bulk' in pendingDelete) {
      await runBulk('delete', pendingDelete.bulk);
    } else {
      try {
        await remove.mutateAsync(pendingDelete.client.id);
        showToaster('success', `${pendingDelete.client.name} deleted.`);
      } catch (error) {
        showToaster('error', getApiErrorMessage(error, 'Could not delete the client.'));
      }
    }
    setPendingDelete(null);
  };

  const filtered = Boolean(list.search || status);
  const rowActions = can.update || can.delete;

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <Head title={PAGE_TITLE} />
      <PageHeader
        eyebrow="Clients"
        title={PAGE_TITLE}
        description="The businesses this workspace does SEO for. Each has its own sites; people with client access see only the clients assigned to them."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setHistoryPage(1);
                setHistoryOpen(true);
              }}
              title="Who changed what on this page, and when"
            >
              History
              {history.data && <span className="rounded bg-secondary px-1.5 text-xs tabular-nums text-muted-foreground">{history.data.meta.total}</span>}
            </Button>
            {can.create && (
              <Button onClick={() => setDrawer({ open: true })}>
                <Plus />
                Add client
              </Button>
            )}
          </div>
        }
      />

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative lg:w-96">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            value={list.searchInput}
            onChange={(e) => list.setSearchInput(e.target.value)}
            placeholder="Search client or contact"
            aria-label="Search client or contact"
            className="pl-9"
          />
        </div>
        <ActiveFilter value={status} summary={query.data?.summary} onChange={(s) => list.update({ status: s, page: undefined })} />
        {filtered && (
          <Button
            variant="ghost"
            size="sm"
            className="self-start lg:self-auto"
            onClick={() => {
              list.setSearchInput('');
              list.update({ status: undefined, page: undefined });
            }}
          >
            <X />
            Clear filters
          </Button>
        )}
      </div>

      {query.isError ? (
        <FormAlert tone="error">
          <p>We could not load the clients.</p>
          <p>
            <button type="button" className="font-medium underline" onClick={() => query.refetch()}>
              Try again
            </button>
          </p>
        </FormAlert>
      ) : query.isPending ? (
        <DataTableSkeleton columns={clientColumns} label="Loading the clients" selectable={rowActions} actions={rowActions} />
      ) : clients.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded border border-dashed bg-card px-6 py-14 text-center">
          <Building2 className="size-6 text-muted-foreground" aria-hidden />
          <p className="text-sm font-medium">{filtered ? 'No clients match' : 'No clients yet'}</p>
          <p className="text-sm text-muted-foreground">{filtered ? 'Try another name or status.' : 'Add the businesses you do SEO for, then their sites.'}</p>
        </div>
      ) : (
        <div className={query.isFetching ? 'space-y-2 opacity-60 transition-opacity' : 'space-y-2 transition-opacity'}>
          {rowActions && selection.count > 0 && (
            <ActiveBulkBar
              count={selection.count}
              canUpdate={can.update}
              canDelete={can.delete}
              pending={bulk.isPending ? bulk.variables?.action : undefined}
              onAction={(action) => (action === 'delete' ? setPendingDelete({ bulk: selection.ids }) : runBulk(action, selection.ids))}
              onClear={selection.clear}
            />
          )}
          <DataTable
            rows={clients}
            columns={clientColumns}
            rowLabel={(c) => c.name}
            noun="clients"
            cardBadge={(c) => <ActiveStatus active={c.isActive} />}
            muted={(c) => !c.isActive}
            sort={sort}
            onSort={onSort}
            actions={
              rowActions
                ? {
                    onEdit: can.update ? (client) => setDrawer({ open: true, client }) : undefined,
                    onDelete: can.delete ? (client) => setPendingDelete({ client }) : undefined,
                    selection,
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
          <p className="text-xs text-muted-foreground">A client with sites can't be deleted: delete its sites first, or make it inactive.</p>
        </div>
      )}

      {(can.create || can.update) && <ClientFormSheet open={drawer.open} onOpenChange={(open) => setDrawer((d) => ({ ...d, open }))} client={drawer.client} />}
      <ConfirmationDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        variant="danger"
        title={pendingDelete && 'bulk' in pendingDelete ? `Delete ${plural(pendingDelete.bulk.length)}?` : 'Delete this client?'}
        description={
          pendingDelete && 'client' in pendingDelete
            ? `${pendingDelete.client.name} will be removed. Its change history is kept. To stop working on it only for now, make it inactive instead.`
            : 'They will be removed. Their change history is kept. To stop working on them only for now, deactivate them instead.'
        }
        confirmLabel="Delete"
        isLoading={remove.isPending || bulk.isPending}
        onConfirm={confirmDelete}
      />
      <ChangeHistorySheet
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        pageTitle={PAGE_TITLE}
        history={history.data}
        isPending={history.isPending}
        isError={history.isError}
        onRetry={() => history.refetch()}
        onPageChange={setHistoryPage}
        fieldLabels={FIELD_LABELS}
      />
    </div>
  );
}
