import { Eye, History as HistoryIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Paginator } from '@/components/Paginator';
import { DataTable, DataTableSkeleton, type DataColumn } from '@/components/table/DataTable';
import { FormAlert } from '@/features/auth/components/FormAlert';
import { formatNumber } from '@/features/search-console/lib/format';
import { useListParams } from '@/hooks/useListParams';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/utils/formatDate';
import { getApiErrorMessage } from '@/utils/formErrorHandler';
import { useAudits } from '../../hooks/useSiteAudit';
import { isRunning } from '../../lib/auditStatus';
import type { Audit } from '../../types';
import { ComparisonChip } from '../Comparison';
import { HealthPill } from '../ScoreGauge';
import { AuditStatusBadge, SeverityCountsInline } from '../overview/cells';
import { HealthTrendChart, HealthTrendSkeleton } from './HealthTrendChart';

interface Props {
  siteId: number;
  /** The audit on screen, marked in the table. */
  currentId: number;
  /** Recent audits for the trend (the page's first 30). */
  recent: Audit[] | undefined;
  onSelect: (audit: Audit) => void;
}

/** Past audits, newest first, with the health score trend; a finished audit opens in the page. */
export function HistoryTab({ siteId, currentId, recent, onSelect }: Props) {
  const list = useListParams();
  const audits = useAudits(siteId, { page: list.page, perPage: list.perPage });
  const rows = audits.data?.data ?? [];
  const meta = audits.data?.meta;

  const columns: DataColumn<Audit, string>[] = [
    {
      label: 'Audit',
      skeleton: 'w-32',
      cell: (a) => (
        <span className="block">
          <span className="flex items-center gap-1.5 text-sm font-medium tabular-nums">
            {formatDateTime(a.finishedAt ?? a.startedAt ?? '')}
            {a.id === currentId && <span className="rounded bg-accent px-1.5 py-0.5 text-2xs font-semibold text-primary">Showing</span>}
          </span>
          <span className="block text-xs text-muted-foreground">
            {a.trigger === 'scheduled' ? 'Scheduled' : `Run by ${a.triggeredBy?.name ?? 'someone'}`}
          </span>
        </span>
      ),
    },
    { label: 'Status', skeleton: 'w-16', cell: (a) => <AuditStatusBadge audit={a} /> },
    { label: 'Health', skeleton: 'w-20', cell: (a) => <HealthPill score={a.status === 'done' ? a.healthScore : null} /> },
    { label: 'Issues', skeleton: 'w-28', cell: (a) => (a.status === 'done' ? <SeverityCountsInline counts={a.counts} /> : <span className="text-xs text-muted-foreground">—</span>) },
    { label: 'Changes', skeleton: 'w-24', cell: (a) => (a.status === 'done' ? <ComparisonChip comparison={a.comparison} /> : <span className="text-xs text-muted-foreground">—</span>) },
    { label: 'Pages', align: 'right', skeleton: 'w-10', cell: (a) => <span className="tabular-nums">{formatNumber(a.pagesCrawled)}</span> },
  ];

  return (
    <div className="space-y-3">
      {recent === undefined ? <HealthTrendSkeleton /> : <HealthTrendChart audits={recent} />}

      {audits.isError ? (
        <FormAlert tone="error">
          <p>{getApiErrorMessage(audits.error, 'We could not load the audit history.')}</p>
          <p>
            <button type="button" className="font-medium underline" onClick={() => audits.refetch()}>
              Try again
            </button>
          </p>
        </FormAlert>
      ) : audits.isPending ? (
        <DataTableSkeleton columns={columns} label="Loading the audit history" selectable={false} actions={false} />
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded border border-dashed bg-card px-6 py-10 text-center">
          <HistoryIcon className="size-6 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">No audits yet.</p>
        </div>
      ) : (
        <div className={cn('transition-opacity', audits.isFetching && 'opacity-60')}>
          <DataTable
            rows={rows}
            columns={columns}
            rowLabel={(a) => `audit of ${formatDateTime(a.finishedAt ?? a.startedAt ?? '')}`}
            noun="audits"
            rowClassName={(a) => (a.id === currentId ? 'bg-accent/40' : undefined)}
            onRowClick={(a) => a.status === 'done' && onSelect(a)}
            actions={{
              extra: (a) =>
                a.status === 'done' && a.id !== currentId && !isRunning(a) ? (
                  <Button variant="ghost" size="icon" className="size-6 text-primary hover:text-primary/80" onClick={() => onSelect(a)} aria-label={`Open the audit of ${formatDateTime(a.finishedAt ?? '')}`} title="Open">
                    <Eye className="size-3.5" />
                  </Button>
                ) : null,
            }}
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
    </div>
  );
}
