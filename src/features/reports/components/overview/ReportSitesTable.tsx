import { useNavigate } from 'react-router';
import { CalendarClock, ChevronRight, FilePlus2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, type DataColumn } from '@/components/table/DataTable';
import { formatDate } from '@/utils/formatDate';
import { scheduleLabel } from '../../lib/schedule';
import type { ReportSite } from '../../types';
import { DeliveryMarkers, ReportStatusBadge } from '../cells';

interface Props {
  sites: ReportSite[];
  canCreate: boolean;
  onGenerate: (site: ReportSite) => void;
}

/** Reports overview: one row per site with its last report and monthly schedule; a row opens the site's reports. */
export function ReportSitesTable({ sites, canCreate, onGenerate }: Props) {
  const navigate = useNavigate();
  const open = (s: ReportSite) => navigate(`/dashboard/reports/${s.id}`);

  const columns: DataColumn<ReportSite, string>[] = [
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
    {
      label: 'Last report',
      wideOnCard: true,
      cell: (s) =>
        s.lastReport ? (
          <span className="flex min-w-0 flex-col gap-1">
            <span className="flex flex-wrap items-center gap-1.5">
              <span className="text-sm font-medium">{s.lastReport.periodLabel}</span>
              <ReportStatusBadge status={s.lastReport.status} />
              <DeliveryMarkers report={s.lastReport} />
            </span>
            <span className="text-xs text-muted-foreground">Created {formatDate(s.lastReport.createdAt)}</span>
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">No reports yet</span>
        ),
    },
    {
      label: 'Schedule',
      cell: (s) =>
        s.schedule?.isActive ? (
          <span className="inline-flex items-center gap-1.5 text-sm">
            <CalendarClock className="size-3.5 shrink-0 text-primary" aria-hidden />
            {scheduleLabel(s.schedule)}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Off</span>
        ),
    },
  ];

  return (
    <DataTable
      rows={sites}
      columns={columns}
      rowLabel={(s) => s.name}
      noun="sites"
      onRowClick={open}
      actions={
        canCreate
          ? {
              extra: (s) => (
                <Button variant="ghost" size="icon" className="size-6 text-primary hover:text-primary/80" onClick={() => onGenerate(s)} aria-label={`Generate a report for ${s.name}`} title="Generate report">
                  <FilePlus2 className="size-3.5" />
                </Button>
              ),
            }
          : undefined
      }
    />
  );
}
