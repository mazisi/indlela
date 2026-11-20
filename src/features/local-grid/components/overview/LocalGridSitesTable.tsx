import { useNavigate } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { DataTable, type DataColumn } from '@/components/table/DataTable';
import { formatNumber } from '@/features/search-console/lib/format';
import { formatDate } from '@/utils/formatDate';
import { formatAvgRank, formatShare, scanDate } from '../../lib/labels';
import { sitePath } from '../../lib/permissions';
import type { LocalGridSite } from '../../types';
import { Muted, ScanStatusBadge } from '../cells';

/** Local grid's overview: one row per site the user can see; a row opens the site's grids. */
export function LocalGridSitesTable({ sites }: { sites: LocalGridSite[] }) {
  const navigate = useNavigate();
  const open = (s: LocalGridSite) => navigate(sitePath(s.id));
  const done = (s: LocalGridSite) => (s.latestScan?.status === 'done' ? s.latestScan : null);

  const columns: DataColumn<LocalGridSite, string>[] = [
    {
      label: 'Site',
      cell: (s) => (
        <button type="button" onClick={() => open(s)} className="group block min-w-0 max-w-72 text-left">
          <span className="flex items-center gap-1 text-sm font-semibold text-foreground group-hover:text-primary group-hover:underline">
            <span className="truncate">{s.name}</span>
            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          </span>
          <span className="block truncate text-xs text-muted-foreground">{s.client ? `${s.client.name} · ${s.domain || s.url}` : s.domain || s.url}</span>
        </button>
      ),
    },
    { label: 'Grids', align: 'right', cell: (s) => <span className="tabular-nums">{formatNumber(s.gridsCount)}</span> },
    {
      label: 'Latest scan',
      cell: (s) =>
        s.latestScan ? (
          <span className="flex min-w-0 max-w-64 items-center gap-2">
            <span className="truncate text-sm" title={s.latestScan.keyword}>
              {s.latestScan.keyword}
            </span>
            {s.latestScan.status !== 'done' && <ScanStatusBadge scan={s.latestScan} />}
          </span>
        ) : (
          <Muted>{s.gridsCount ? 'Not scanned yet' : 'No grids'}</Muted>
        ),
    },
    {
      label: 'Avg rank',
      align: 'right',
      cell: (s) => <span className="font-semibold tabular-nums">{formatAvgRank(done(s)?.arp)}</span>,
    },
    { label: 'Top 3 share', align: 'right', cell: (s) => <span className="tabular-nums">{formatShare(done(s)?.solv)}</span> },
    {
      label: 'When',
      cell: (s) => (s.latestScan ? <span className="text-sm tabular-nums">{formatDate(scanDate(s.latestScan))}</span> : <Muted>—</Muted>),
    },
  ];

  return <DataTable rows={sites} columns={columns} rowLabel={(s) => s.name} noun="sites" onRowClick={open} />;
}
