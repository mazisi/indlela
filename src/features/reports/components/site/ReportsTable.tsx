import { useNavigate } from 'react-router';
import { DataTable, type DataColumn } from '@/components/table/DataTable';
import type { RowSelection } from '@/hooks/useRowSelection';
import { formatDate } from '@/utils/formatDate';
import type { ReportActions } from '../../hooks/useReportActions';
import type { ReportRow } from '../../types';
import { ReportStatusBadge, ReportStatusCell, SentTo, ShareState } from '../cells';
import { ReportRowMenu } from './ReportRowMenu';

interface Props {
  siteId: number;
  rows: ReportRow[];
  canCreate: boolean;
  canDelete: boolean;
  actions: ReportActions;
  onSend: (row: ReportRow) => void;
  onRevoke: (row: ReportRow) => void;
  onDelete: (row: ReportRow) => void;
  /** Checkboxes for the bulk bar (with create or delete permission). */
  selection?: RowSelection<number>;
}

/** A site's reports, newest first: a ready one opens its preview; row actions follow the user's permissions. */
export function ReportsTable({ siteId, rows, canCreate, canDelete, actions, onSend, onRevoke, onDelete, selection }: Props) {
  const navigate = useNavigate();
  const open = (r: ReportRow) => navigate(`/dashboard/reports/${siteId}/${r.id}`);
  const ready = (r: ReportRow) => r.status === 'ready';

  const columns: DataColumn<ReportRow, string>[] = [
    {
      label: 'Report',
      cell: (r) => (
        <span className="flex min-w-0 max-w-72 flex-col">
          {ready(r) ? (
            <button type="button" onClick={() => open(r)} className="truncate text-left text-sm font-semibold text-foreground hover:text-primary hover:underline">
              {r.title}
            </button>
          ) : (
            <span className="truncate text-sm font-semibold">{r.title}</span>
          )}
          <span className="truncate text-xs text-muted-foreground">
            {r.periodLabel} · {r.trigger === 'scheduled' ? 'Monthly schedule' : (r.generatedBy?.name ?? 'Manual')}
          </span>
        </span>
      ),
    },
    { label: 'Status', hideOnCard: true, cell: (r) => <ReportStatusCell report={r} /> },
    {
      label: 'Summary',
      wideOnCard: true,
      className: 'whitespace-normal',
      cell: (r) =>
        r.summary[0] ? (
          <span className="line-clamp-2 max-w-80 text-sm" title={r.summary.join('\n')}>
            {r.summary[0]}
            {r.summary.length > 1 && <span className="text-xs text-muted-foreground"> +{r.summary.length - 1} more</span>}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">{r.status === 'generating' ? 'Being written…' : '—'}</span>
        ),
    },
    { label: 'Sent to', cell: (r) => <SentTo report={r} /> },
    { label: 'Share', cell: (r) => <ShareState share={r.share} /> },
    { label: 'Created', cell: (r) => <span className="text-sm tabular-nums">{formatDate(r.createdAt)}</span> },
  ];

  return (
    <DataTable
      rows={rows}
      columns={columns}
      rowLabel={(r) => r.title}
      noun="reports"
      cardBadge={(r) => <ReportStatusBadge status={r.status} />}
      onRowClick={(r) => ready(r) && open(r)}
      actions={{
        selection,
        // A report still generating can't be deleted or revoked in bulk.
        canSelect: (r) => r.status !== 'generating',
        extra: (r) => (
          <ReportRowMenu
            report={r}
            canCreate={canCreate}
            canDelete={canDelete}
            actions={actions}
            onView={() => open(r)}
            onSend={() => onSend(r)}
            onRevoke={() => onRevoke(r)}
            onDelete={() => onDelete(r)}
          />
        ),
      }}
    />
  );
}
