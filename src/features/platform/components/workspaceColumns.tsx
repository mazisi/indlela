import type { DataColumn } from '@/components/table/DataTable';
import { formatNumber } from '@/features/search-console/lib/format';
import { formatDateTime } from '@/utils/formatDate';
import { formatUsd } from '../lib/format';
import type { WorkspaceSortKey, WorkspaceUsage } from '../types';
import { CostSparkline, KeywordUsage } from './cells';

const muted = (text: string) => <span className="text-xs text-muted-foreground">{text}</span>;

export const workspaceColumns: DataColumn<WorkspaceUsage, WorkspaceSortKey>[] = [
  {
    label: 'Workspace',
    sortKey: 'name',
    skeleton: 'w-40',
    cell: (w) => (
      <div className="min-w-0 max-w-64">
        <p className="truncate text-sm font-semibold text-foreground">{w.name}</p>
        <p className="truncate text-xs text-muted-foreground" title={w.owner ? `${w.owner.name} · ${w.owner.email}` : undefined}>
          {w.slug}
          {w.owner ? ` · ${w.owner.email}` : ' · no owner'}
        </p>
      </div>
    ),
  },
  { label: 'Keywords', sortKey: 'keywords_tracked', skeleton: 'w-28', cell: (w) => <KeywordUsage row={w} /> },
  { label: 'Sites', align: 'right', skeleton: 'w-6', cell: (w) => <span className="tabular-nums">{formatNumber(w.sitesCount)}</span> },
  {
    label: 'Checks',
    sortKey: 'checks_this_month',
    align: 'right',
    skeleton: 'w-12',
    cell: (w) => (
      <span className="block tabular-nums">
        {formatNumber(w.checksThisMonth)}
        <span className="block text-xs text-muted-foreground">{w.liveChecksThisMonth ? `${formatNumber(w.liveChecksThisMonth)} live` : 'no live'}</span>
      </span>
    ),
  },
  { label: 'This month', sortKey: 'cost_this_month', align: 'right', skeleton: 'w-14', cell: (w) => <span className="font-semibold tabular-nums">{formatUsd(w.costThisMonth)}</span> },
  { label: 'Last month', sortKey: 'cost_last_month', align: 'right', skeleton: 'w-14', cell: (w) => <span className="tabular-nums text-muted-foreground">{formatUsd(w.costLastMonth)}</span> },
  { label: '6 months', skeleton: 'w-16', cell: (w) => <CostSparkline series={w.series} /> },
  {
    label: 'Last check',
    sortKey: 'last_check_at',
    skeleton: 'w-24',
    cell: (w) => (w.lastCheckAt ? <span className="text-sm tabular-nums">{formatDateTime(w.lastCheckAt)}</span> : muted('Never')),
  },
];
