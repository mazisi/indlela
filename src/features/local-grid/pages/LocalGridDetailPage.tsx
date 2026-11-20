import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { Pencil, Radar, SearchX, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Head } from '@/components/ui/Head';
import { StateCard } from '@/components/page/StateCard';
import { usePermissions } from '@/contexts/PermissionContextType';
import { FormAlert } from '@/features/auth/components/FormAlert';
import { useGrid, useLocalGridSites, useLocalGridUsage, useScan } from '../hooks/useLocalGrid';
import { useScanNow } from '../hooks/useScanNow';
import { withPlannedPoints } from '../lib/geometry';
import { isScanActive } from '../lib/labels';
import { isNotFound } from '../lib/errors';
import { LOCAL_GRID_PERMISSIONS, sitePath } from '../lib/permissions';
import { gridScanBlocked, scanNowBlocked } from '../lib/usage';
import type { Grid, GridDetail, ScanDetail, ScanPoint } from '../types';
import { LoadError } from '../components/LoadError';
import { GridNotFoundState, ScansPausedNotice } from '../components/StateCards';
import { GridSheet } from '../components/form/GridSheet';
import { CompetitorsTable } from '../components/grid/CompetitorsTable';
import { GridDetailSkeleton } from '../components/grid/GridDetailSkeleton';
import { GridHeader } from '../components/grid/GridHeader';
import { GridKpis } from '../components/grid/GridKpis';
import { HeatmapPanel } from '../components/grid/HeatmapPanel';
import { PointSheet } from '../components/grid/PointSheet';
import { ScanNowButton } from '../components/grid/ScanNowButton';
import { ScanPicker } from '../components/grid/ScanPicker';
import { ScanProgress } from '../components/grid/ScanProgress';

const pendingPoint = (c: { row: number; col: number; lat: number; lng: number }): ScanPoint => ({ ...c, status: 'pending', rank: null, top: [] });

/**
 * One grid: its latest scan (or one picked from the history) as figures, a
 * heatmap on the map and the competitors who hold the map pack. A scan under
 * way shows its progress and fills in as the page polls; a point opens its
 * top 3 in a drawer.
 */
export default function LocalGridDetailPage() {
  const params = useParams();
  const siteId = Number(params.siteId);
  const gridId = Number(params.gridId);
  const { hasPermission } = usePermissions();
  const canUpdate = hasPermission(LOCAL_GRID_PERMISSIONS.update);
  const [search, setSearch] = useSearchParams();

  const sites = useLocalGridSites();
  const usage = useLocalGridUsage();
  const site = sites.data?.find((s) => s.id === siteId);
  const query = useGrid(gridId);
  const grid = query.data;
  const scanNow = useScanNow(siteId);
  const [editing, setEditing] = useState<Grid>();
  const [editOpen, setEditOpen] = useState(false);

  const scanParam = Number(search.get('scan')) || undefined;
  const scans = grid?.scans ?? [];
  const scanId = (scanParam && scans.some((s) => s.id === scanParam) ? scanParam : undefined) ?? grid?.latestScan?.id ?? scans[0]?.id;
  const pickScan = (id: number | undefined) =>
    setSearch(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (id === undefined || id === (grid?.latestScan?.id ?? scans[0]?.id)) next.delete('scan');
        else next.set('scan', String(id));
        next.delete('page');
        return next;
      },
      { replace: true },
    );

  const blocked = grid ? gridScanBlocked(grid, scanNowBlocked(usage.data)) : null;
  const runScan = () => grid && scanNow.run(grid, () => pickScan(undefined));

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <Head title={grid ? `${grid.keyword} · Local grid` : 'Local grid'} />
      <GridHeader
        siteId={siteId}
        site={site}
        grid={grid}
        actions={
          grid &&
          canUpdate && (
            <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label="Grid actions">
              <Button
                variant="outline"
                onClick={() => {
                  setEditing(grid);
                  setEditOpen(true);
                }}
              >
                <Pencil />
                Edit
              </Button>
              <ScanNowButton blocked={blocked} busy={scanNow.scanningId === grid.id} onScan={runScan} />
            </div>
          )
        }
      />

      {usage.data?.paused && grid && <ScansPausedNotice />}

      {query.isPending ? (
        <GridDetailSkeleton />
      ) : query.isError || !grid ? (
        isNotFound(query.error) ? (
          <GridNotFoundState siteId={siteId} />
        ) : (
          <LoadError error={query.error} what="the grid" onRetry={() => query.refetch()} />
        )
      ) : scanId === undefined ? (
        <StateCard icon={Radar} title="No scans yet">
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            {canUpdate ? 'Run the first scan to see where the business shows across the area. Results arrive in about a minute.' : 'The first scan hasn’t run yet. Its heatmap shows here once it has.'}
          </p>
          {canUpdate && (
            <Button className="mt-5" onClick={runScan} disabled={Boolean(blocked) || scanNow.scanningId === grid.id}>
              <Zap />
              Scan now
            </Button>
          )}
          {canUpdate && blocked && <p className="mt-2 text-xs text-muted-foreground">{blocked}</p>}
        </StateCard>
      ) : (
        <ScanView grid={grid} scanId={scanId} onPick={pickScan} />
      )}

      {site && canUpdate && <GridSheet siteId={siteId} siteName={site.name} open={editOpen} onOpenChange={setEditOpen} grid={editing} />}
    </div>
  );
}

function ScanView({ grid, scanId, onPick }: { grid: GridDetail; scanId: number; onPick: (id: number) => void }) {
  const scan = useScan(scanId);
  const [point, setPoint] = useState<{ row: number; col: number }>();
  const index = grid.scans.findIndex((s) => s.id === scanId);
  const previous = grid.scans.slice(index + 1).find((s) => s.status === 'done');
  const data: ScanDetail | undefined = scan.data && { ...scan.data, points: withPlannedPoints(scan.data.points, scan.data, pendingPoint) };
  const selected = point && data?.points.find((p) => p.row === point.row && p.col === point.col);

  return (
    <div className="space-y-4">
      {grid.scans.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground">{index > 0 ? 'An earlier scan' : 'Latest scan'}</h2>
          <ScanPicker scans={grid.scans} value={scanId} onChange={onPick} />
        </div>
      )}

      {scan.isPending ? (
        <GridDetailSkeleton />
      ) : scan.isError && isNotFound(scan.error) ? (
        <StateCard icon={SearchX} title="This scan is no longer available">
          <p className="mt-1 max-w-md text-sm text-muted-foreground">Its grid was deleted, or you no longer have access to it.</p>
          <Button asChild variant="outline" className="mt-5">
            <Link to={sitePath(grid.siteId)}>Back to the site's grids</Link>
          </Button>
        </StateCard>
      ) : scan.isError || !data ? (
        <LoadError error={scan.error} what="the scan" onRetry={() => scan.refetch()} />
      ) : (
        <>
          {isScanActive(data) ? (
            <ScanProgress scan={data} />
          ) : data.status === 'failed' ? (
            <FormAlert tone="error">
              <p className="font-medium">This scan failed.</p>
              <p>{data.error ?? 'Something went wrong while checking the grid.'} Run Scan now to try again.</p>
            </FormAlert>
          ) : (
            <GridKpis scan={data} previous={previous} />
          )}

          <HeatmapPanel scan={data} business={grid.business} selected={selected} onSelect={(p) => setPoint({ row: p.row, col: p.col })} />

          {data.status === 'done' && (
            <section className="space-y-3" aria-labelledby="competitors-title">
              <div>
                <h2 id="competitors-title" className="text-base font-semibold">
                  Competitors
                </h2>
                <p className="text-xs text-muted-foreground">Who holds the map pack's top 3 most often across the grid.</p>
              </div>
              <CompetitorsTable competitors={data.competitors} pointsTotal={data.pointsTotal} business={grid.business} />
            </section>
          )}
        </>
      )}

      <PointSheet point={selected} businessTitle={grid.business.title} onClose={() => setPoint(undefined)} />
    </div>
  );
}
