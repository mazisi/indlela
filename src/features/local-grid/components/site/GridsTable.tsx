import { ChevronRight } from 'lucide-react';
import { DataTable, type DataColumn } from '@/components/table/DataTable';
import { formatDate } from '@/utils/formatDate';
import { formatAvgRank, formatShare, gridShape, scanDate } from '../../lib/labels';
import type { Grid } from '../../types';
import { DeviceTag, Muted, ScanStatusBadge, ScheduleCell } from '../cells';
import { LatestScanHeatmap } from '../MiniHeatmap';
import { GridRowMenu, type GridMenuAccess } from './GridRowMenu';

export interface GridsTableActions extends GridMenuAccess {
  scanningId: number | undefined;
  onOpen: (grid: Grid) => void;
  onScan: (grid: Grid) => void;
  onEdit: (grid: Grid) => void;
  onToggleActive: (grid: Grid) => void;
  onDelete: (grid: Grid) => void;
}

/** A finished latest scan's figures; nothing while one runs or failed. */
const done = (g: Grid) => (g.latestScan?.status === 'done' ? g.latestScan : null);

/** A site's grids: keyword and business, shape, latest heatmap and figures, schedule, and the row menu. */
export function GridsTable({ grids, actions }: { grids: Grid[]; actions: GridsTableActions }) {
  const columns: DataColumn<Grid, string>[] = [
    {
      label: 'Keyword',
      cell: (g) => (
        <button type="button" onClick={() => actions.onOpen(g)} className="group block min-w-0 max-w-72 text-left">
          <span className="flex items-center gap-1 text-sm font-semibold text-foreground group-hover:text-primary group-hover:underline">
            <span className="truncate">{g.keyword}</span>
            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          </span>
          <span className="block truncate text-xs text-muted-foreground" title={g.business.address ?? undefined}>
            {g.business.title}
          </span>
        </button>
      ),
    },
    {
      label: 'Grid',
      cell: (g) => (
        <span className="block">
          <span className="block text-sm tabular-nums">{gridShape(g.size, g.spacingKm)}</span>
          <DeviceTag device={g.device} />
        </span>
      ),
    },
    { label: 'Heatmap', cell: (g) => <LatestScanHeatmap scan={g.latestScan} /> },
    { label: 'Avg rank', align: 'right', cell: (g) => <span className="font-semibold tabular-nums">{formatAvgRank(done(g)?.arp)}</span> },
    { label: 'Top 3 share', align: 'right', cell: (g) => <span className="tabular-nums">{formatShare(done(g)?.solv)}</span> },
    { label: 'Found', align: 'right', cell: (g) => <span className="tabular-nums">{formatShare(done(g)?.foundPct)}</span> },
    {
      label: 'Last scan',
      cell: (g) =>
        g.latestScan ? (
          <span className="block">
            <span className="block text-sm tabular-nums">{formatDate(scanDate(g.latestScan))}</span>
            {g.latestScan.status === 'failed' && <ScanStatusBadge scan={g.latestScan} />}
          </span>
        ) : (
          <Muted>Never</Muted>
        ),
    },
    { label: 'Schedule', cell: (g) => <ScheduleCell grid={g} /> },
  ];

  return (
    <DataTable
      rows={grids}
      columns={columns}
      rowLabel={(g) => g.keyword}
      noun="grids"
      muted={(g) => !g.isActive}
      onRowClick={actions.onOpen}
      actions={{
        extra: (g) => (
          <GridRowMenu
            grid={g}
            busy={actions.scanningId === g.id}
            canUpdate={actions.canUpdate}
            canDelete={actions.canDelete}
            scanBlocked={actions.scanBlocked}
            onOpen={() => actions.onOpen(g)}
            onScan={() => actions.onScan(g)}
            onEdit={() => actions.onEdit(g)}
            onToggleActive={() => actions.onToggleActive(g)}
            onDelete={() => actions.onDelete(g)}
          />
        ),
      }}
    />
  );
}
