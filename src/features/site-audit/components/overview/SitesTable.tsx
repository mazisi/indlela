import { useNavigate } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { DataTable, type DataColumn } from '@/components/table/DataTable';
import { formatDate } from '@/utils/formatDate';
import { scheduleLabel } from '../../lib/auditStatus';
import type { AuditSite } from '../../types';
import { AuditProgress } from '../AuditProgress';
import { ComparisonChip } from '../Comparison';
import { HealthPill } from '../ScoreGauge';
import { AuditStatusBadge, SeverityCountsInline } from './cells';

const done = (s: AuditSite) => (s.latestAudit?.status === 'done' ? s.latestAudit : null);

/** Site audit's overview: one row per site the user can see; a row opens the site's audit. */
export function SitesTable({ sites }: { sites: AuditSite[] }) {
  const navigate = useNavigate();
  const open = (s: AuditSite) => navigate(`/dashboard/site-audit/${s.id}`);

  const columns: DataColumn<AuditSite, string>[] = [
    {
      label: 'Site',
      skeleton: 'w-40',
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
    { label: 'Health', skeleton: 'w-20', cell: (s) => <HealthPill score={done(s)?.healthScore ?? null} /> },
    {
      label: 'Issues',
      skeleton: 'w-32',
      cell: (s) => {
        const audit = done(s);
        return audit ? <SeverityCountsInline counts={audit.counts} /> : <span className="text-xs text-muted-foreground">—</span>;
      },
    },
    {
      label: 'Changes',
      skeleton: 'w-24',
      cell: (s) => {
        const audit = done(s);
        return audit ? <ComparisonChip comparison={audit.comparison} /> : <span className="text-xs text-muted-foreground">—</span>;
      },
    },
    {
      label: 'Last audit',
      skeleton: 'w-24',
      wideOnCard: true,
      cell: (s) =>
        s.runningAudit ? (
          <AuditProgress audit={s.runningAudit} compact />
        ) : s.latestAudit ? (
          <span className="inline-flex items-center gap-1.5 text-sm tabular-nums">
            {s.latestAudit.finishedAt ? formatDate(s.latestAudit.finishedAt) : '—'}
            {s.latestAudit.status !== 'done' && <AuditStatusBadge audit={s.latestAudit} />}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Never audited</span>
        ),
    },
    { label: 'Schedule', skeleton: 'w-28', cell: (s) => <span className="text-xs text-muted-foreground">{scheduleLabel(s.auditSchedule, s.auditPageLimit)}</span> },
  ];

  return <DataTable rows={sites} columns={columns} rowLabel={(s) => s.name} noun="sites" onRowClick={open} />;
}
