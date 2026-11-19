import { useState } from 'react';
import { Globe, Plus, Search, X } from 'lucide-react';
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
import { siteColumns } from '../components/siteColumns';
import { SiteFormSheet } from '../components/SiteFormSheet';
import { ClientSelect } from '../components/ClientSelect';
import { useBulkUpdateSites, useDeleteSite, useSiteHistory, useSites } from '../hooks/useSites';
import { SITE_SORT_KEYS, type Site } from '../types';

const PAGE_TITLE = 'Sites';

const FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  url: 'Website address',
  domain: 'Domain',
  client: 'Client',
  client_id: 'Client',
  is_active: 'Active',
};

const BULK_DONE: Record<ActiveBulkAction, string> = { activate: 'activated', deactivate: 'deactivated', delete: 'deleted' };
const plural = (n: number) => `${n} ${n === 1 ? 'site' : 'sites'}`;
const STATUSES: ActiveFilterValue[] = ['active', 'inactive'];

/** A delete waiting for confirmation: one site, or the selection. */
type PendingDelete = { site: Site } | { bulk: number[] } | null;

/**
 * Clients › Sites: the clients' websites, for every client or one
 * (`?clientId=`). Users with client access see only their clients' sites (the
 * API scopes the list). Client, search, status, sort and page live in the URL.
 */
export default function SitesPage() {
  const { hasPermission, user } = usePermissions();
  const can = {
    create: hasPermission('create_clients_sites'),
    update: hasPermission('update_clients_sites'),
    delete: hasPermission('delete_clients_sites'),
  };
  const clients = user?.clients ?? [];

  const list = useListParams();
  const { sort, onSort } = useUrlSort(SITE_SORT_KEYS);
  const status = STATUSES.find((s) => s === list.params.get('status'));
  const clientId = Number(list.params.get('clientId')) || undefined;
  const client = clients.find((c) => c.id === clientId);
  const query = useSites({ page: list.page, perPage: list.perPage, clientId, search: list.search, status, sort });
  const sites = query.data?.data ?? [];
  const meta = query.data?.meta;
  const [historyPage, setHistoryPage] = useState(1);
  const history = useSiteHistory(historyPage);

  const selection = useRowSelection(
    sites.map((s) => s.id),
    list.params.toString(),
  );
  const remove = useDeleteSite();
  const bulk = useBulkUpdateSites();

  const [drawer, setDrawer] = useState<{ open: boolean; site?: Site }>({ open: false });
  const [historyOpen, setHistoryOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);

  const runBulk = async (action: ActiveBulkAction, ids: number[]) => {
    try {
      const { affected } = await bulk.mutateAsync({ action, ids });
      showToaster('success', `${plural(affected)} ${BULK_DONE[action]}.`);
      selection.clear();
    } catch (error) {
      showToaster('error', getApiErrorMessage(error, 'Could not update the selected sites.'));
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    if ('bulk' in pendingDelete) {
      await runBulk('delete', pendingDelete.bulk);
    } else {
      try {
        await remove.mutateAsync(pendingDelete.site.id);
        showToaster('success', `${pendingDelete.site.name} deleted.`);
      } catch (error) {
        showToaster('error', getApiErrorMessage(error, 'Could not delete the site.'));
      }
    }
    setPendingDelete(null);
  };

  const filtered = Boolean(list.search || status || clientId);
  const rowActions = can.update || can.delete;

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <Head title={PAGE_TITLE} />
      <PageHeader
        eyebrow={client ? `Clients · ${client.name}` : 'Clients'}
        title={PAGE_TITLE}
        description="Your clients' websites. Search Console, site audits and rank tracking are set up per site; one site per domain in the workspace."
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
              <Button onClick={() => setDrawer({ open: true })} disabled={clients.length === 0} title={clients.length === 0 ? 'Add a client first' : undefined}>
                <Plus />
                Add site
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
            placeholder="Search site or domain"
            aria-label="Search site or domain"
            className="pl-9"
          />
        </div>
        <ClientSelect
          id="sites-client"
          clients={clients}
          value={clientId}
          onChange={(id) => list.update({ clientId: id, page: undefined })}
          allLabel="All clients"
          className="bg-card lg:w-60"
          aria-label="Filter by client"
        />
        <ActiveFilter value={status} summary={query.data?.summary} onChange={(s) => list.update({ status: s, page: undefined })} />
        {filtered && (
          <Button
            variant="ghost"
            size="sm"
            className="self-start lg:self-auto"
            onClick={() => {
              list.setSearchInput('');
              list.update({ status: undefined, clientId: undefined, page: undefined });
            }}
          >
            <X />
            Clear filters
          </Button>
        )}
      </div>

      {query.isError ? (
        <FormAlert tone="error">
          <p>We could not load the sites.</p>
          <p>
            <button type="button" className="font-medium underline" onClick={() => query.refetch()}>
              Try again
            </button>
          </p>
        </FormAlert>
      ) : query.isPending ? (
        <DataTableSkeleton columns={siteColumns} label="Loading the sites" selectable={rowActions} actions={rowActions} />
      ) : sites.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded border border-dashed bg-card px-6 py-14 text-center">
          <Globe className="size-6 text-muted-foreground" aria-hidden />
          <p className="text-sm font-medium">{filtered ? 'No sites match' : 'No sites yet'}</p>
          <p className="text-sm text-muted-foreground">
            {filtered ? 'Try another name, domain, client or status.' : clients.length === 0 ? 'Add a client under Clients first, then its sites.' : "Add your clients' websites."}
          </p>
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
            rows={sites}
            columns={siteColumns}
            rowLabel={(s) => s.name}
            noun="sites"
            cardBadge={(s) => <ActiveStatus active={s.isActive} />}
            muted={(s) => !s.isActive}
            sort={sort}
            onSort={onSort}
            actions={
              rowActions
                ? {
                    onEdit: can.update ? (site) => setDrawer({ open: true, site }) : undefined,
                    onDelete: can.delete ? (site) => setPendingDelete({ site }) : undefined,
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
        </div>
      )}

      {(can.create || can.update) && (
        <SiteFormSheet open={drawer.open} onOpenChange={(open) => setDrawer((d) => ({ ...d, open }))} site={drawer.site} clients={clients} clientId={clientId} />
      )}
      <ConfirmationDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        variant="danger"
        title={pendingDelete && 'bulk' in pendingDelete ? `Delete ${plural(pendingDelete.bulk.length)}?` : 'Delete this site?'}
        description={
          pendingDelete && 'site' in pendingDelete
            ? `${pendingDelete.site.name} will be removed. Its change history is kept. To pause it only for now, make it inactive instead.`
            : 'They will be removed. Their change history is kept. To pause them only for now, deactivate them instead.'
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
