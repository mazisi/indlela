import { useNavigate } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { DataTable, type DataColumn } from '@/components/table/DataTable';
import { formatNumber, formatPosition } from '@/features/search-console/lib/format';
import { formatDate } from '@/utils/formatDate';
import type { RankSite } from '../../types';
import { PositionChange } from '../cells';

const muted = (text: string) => <span className="text-xs text-muted-foreground">{text}</span>;

/** Rank tracking's overview: one row per site the user can see; a row opens the site's rankings. */
export function RankSitesTable({ sites }: { sites: RankSite[] }) {
  const navigate = useNavigate();
  const open = (s: RankSite) => navigate(`/dashboard/rank-tracking/${s.id}`);

  const columns: DataColumn<RankSite, string>[] = [
    {
      label: 'Site',
      cell: (s) => (
        <button type="button" onClick={() => open(s)} className="group block min-w-0 max-w-72 text-left">
          <span className="flex items-center gap-1 text-sm font-semibold text-foreground group-hover:text-primary group-hover:underline">
            <span className="truncate">{s.name}</span>
            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          </span>
          <span className="block truncate text-xs text-muted-foreground">{s.client ? `${s.client.name} · ${s.url}` : s.url}</span>
        </button>
      ),
    },
    { label: 'Keywords', align: 'right', cell: (s) => <span className="tabular-nums">{formatNumber(s.keywordsCount)}</span> },
    {
      label: 'Avg position',
      align: 'right',
      cell: (s) => (s.avgPosition === null ? muted('—') : <span className="font-semibold tabular-nums">{formatPosition(s.avgPosition)}</span>),
    },
    { label: 'Top 3', align: 'right', cell: (s) => <span className="tabular-nums">{s.keywordsCount ? formatNumber(s.top3) : '—'}</span> },
    { label: 'Top 10', align: 'right', cell: (s) => <span className="tabular-nums">{s.keywordsCount ? formatNumber(s.top10) : '—'}</span> },
    { label: '7-day change', cell: (s) => <PositionChange value={s.change7dAvg} context="average over 7 days" /> },
    {
      label: 'Last checked',
      cell: (s) => (s.lastCheckedOn ? <span className="text-sm tabular-nums">{formatDate(s.lastCheckedOn)}</span> : muted(s.keywordsCount ? 'Not checked yet' : 'No keywords')),
    },
  ];

  return <DataTable rows={sites} columns={columns} rowLabel={(s) => s.name} noun="sites" onRowClick={open} />;
}
