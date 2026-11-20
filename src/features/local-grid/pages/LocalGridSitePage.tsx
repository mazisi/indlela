import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Head } from '@/components/ui/Head';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { Paginator } from '@/components/Paginator';
import { SitePageHeader } from '@/components/page/SitePageHeader';
import { DataTableSkeleton } from '@/components/table/DataTable';
import { usePermissions } from '@/contexts/PermissionContextType';
import { useClientPagination } from '@/hooks/useClientPagination';
import showToaster from '@/utils/showToaster';
import { getApiErrorMessage } from '@/utils/formErrorHandler';
import { useDeleteGrid, useLocalGridSites, useLocalGridUsage, useSiteGrids, useUpdateGrid } from '../hooks/useLocalGrid';
import { useScanNow } from '../hooks/useScanNow';
import { gridPath, LOCAL_GRID_PERMISSIONS } from '../lib/permissions';
import { gridsFull, scanNowBlocked } from '../lib/usage';
import type { Grid } from '../types';
import { LoadError } from '../components/LoadError';
import { NoGridsState, ScansPausedNotice, SiteNotFoundState } from '../components/StateCards';
import { GridSheet } from '../components/form/GridSheet';
import { UsageStripCompact } from '../components/overview/UsageStrip';
import { GridsTable } from '../components/site/GridsTable';
import { GRID_COLUMNS_SKELETON } from '../lib/skeletons';

/**
 * One site's local grids: each with its keyword and business, shape, the
 * latest scan as a mini heatmap with its figures, and the schedule. A row
 * opens the grid's heatmap; managers create, scan, edit, pause and delete.
 */
export default function LocalGridSitePage() {
  const siteId = Number(useParams().siteId);
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(LOCAL_GRID_PERMISSIONS.create);
  const canUpdate = hasPermission(LOCAL_GRID_PERMISSIONS.update);
  const canDelete = hasPermission(LOCAL_GRID_PERMISSIONS.delete);

  const sites = useLocalGridSites();
  const usage = useLocalGridUsage();
  const site = sites.data?.find((s) => s.id === siteId);
  const grids = useSiteGrids(siteId, Boolean(site));
  const all = [...(grids.data ?? [])].sort((a, b) => Number(b.isActive) - Number(a.isActive) || a.keyword.localeCompare(b.keyword));
  const paging = useClientPagination(all);

  const scanNow = useScanNow(siteId);
  const update = useUpdateGrid(siteId);
  const remove = useDeleteGrid(siteId);
  const [creating, setCreating] = useState(false);
  // The grid stays set while its drawer closes, so the drawer doesn't flip to "New grid" mid-animation.
  const [editing, setEditing] = useState<Grid>();
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState<Grid>();

  const open = (g: Grid) => navigate(gridPath(siteId, g.id));

  const toggleActive = (g: Grid) =>
    update.mutate(
      { id: g.id, update: { isActive: !g.isActive } },
      {
        onSuccess: () => showToaster('success', g.isActive ? `“${g.keyword}” paused. It isn't scanned until you resume it.` : `“${g.keyword}” resumed.`),
        onError: (e) => {
          const errors = (e as { response?: { data?: { errors?: Record<string, string[]> } } }).response?.data?.errors;
          showToaster('error', errors?.is_active?.[0] ?? getApiErrorMessage(e, 'Could not change the grid.'));
        },
      },
    );

  const confirmDelete = () => {
    if (!deleting) return;
    remove.mutate(deleting.id, {
      onSuccess: () => {
        showToaster('success', `“${deleting.keyword}” deleted.`);
        setDeleting(undefined);
      },
      onError: (e) => showToaster('error', getApiErrorMessage(e, 'Could not delete the grid.')),
    });
  };

  const hasGrids = all.length > 0;

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <Head title={site ? `${site.name} · Local grid` : 'Local grid'} />
      <SitePageHeader
        module="local_grid"
        site={site}
        loading={sites.isPending}
        actions={
          site && (
            <div className="flex flex-wrap items-center gap-2">
              {usage.data && <UsageStripCompact usage={usage.data} />}
              {canCreate && hasGrids && (
                <Button onClick={() => setCreating(true)} disabled={gridsFull(usage.data)} title={gridsFull(usage.data) ? 'Grid limit reached: pause or delete a grid first.' : undefined}>
                  <Plus />
                  New grid
                </Button>
              )}
            </div>
          )
        }
      />

      {usage.data?.paused && site && <ScansPausedNotice />}

      {sites.isPending || (site && grids.isPending) ? (
        <DataTableSkeleton columns={GRID_COLUMNS_SKELETON} label="Loading grids" selectable={false} />
      ) : sites.isError ? (
        <LoadError error={sites.error} what="this site" onRetry={() => sites.refetch()} />
      ) : !site ? (
        <SiteNotFoundState />
      ) : grids.isError ? (
        <LoadError error={grids.error} what="the grids" onRetry={() => grids.refetch()} />
      ) : !hasGrids ? (
        <NoGridsState canCreate={canCreate} onCreate={() => setCreating(true)} />
      ) : (
        <div>
          <GridsTable
            grids={paging.pageRows}
            actions={{
              canUpdate,
              canDelete,
              scanBlocked: scanNowBlocked(usage.data),
              scanningId: scanNow.scanningId,
              onOpen: open,
              onScan: (g) => scanNow.run(g),
              onEdit: (g) => {
                setEditing(g);
                setEditOpen(true);
              },
              onToggleActive: toggleActive,
              onDelete: setDeleting,
            }}
          />
          <Paginator
            currentPage={paging.meta.currentPage}
            lastPage={paging.meta.lastPage}
            totalItems={paging.meta.total}
            perPage={paging.meta.perPage}
            onPageChange={paging.onPageChange}
            onPerPageChange={paging.onPerPageChange}
          />
        </div>
      )}

      {site && canCreate && <GridSheet siteId={site.id} siteName={site.name} open={creating} onOpenChange={setCreating} onCreated={open} />}
      {site && canUpdate && <GridSheet siteId={site.id} siteName={site.name} open={editOpen} onOpenChange={setEditOpen} grid={editing} />}
      <ConfirmationDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(undefined)}
        title="Delete this grid?"
        description={`“${deleting?.keyword ?? ''}” and its scans are removed from the site. You can restore it from Change history.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={remove.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
