import type { DataColumn } from '@/components/table/DataTable';
import type { ReportRow, ReportSite } from '../types';

/** Loading tables with the real columns (cell widths from `skeleton`). */
export const REPORT_SITE_COLUMNS_SKELETON: DataColumn<ReportSite, string>[] = [
  { label: 'Site', skeleton: 'w-40', cell: () => null },
  { label: 'Last report', skeleton: 'w-48', cell: () => null },
  { label: 'Schedule', skeleton: 'w-36', cell: () => null },
];

export const REPORT_COLUMNS_SKELETON: DataColumn<ReportRow, string>[] = [
  { label: 'Report', skeleton: 'w-40', cell: () => null },
  { label: 'Status', skeleton: 'w-16', cell: () => null },
  { label: 'Summary', skeleton: 'w-48', cell: () => null },
  { label: 'Sent to', skeleton: 'w-28', cell: () => null },
  { label: 'Share', skeleton: 'w-20', cell: () => null },
  { label: 'Created', skeleton: 'w-20', cell: () => null },
];
