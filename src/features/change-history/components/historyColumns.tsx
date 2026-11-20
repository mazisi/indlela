import type { DataColumn } from '@/components/table/DataTable';
import { formatDate } from '@/utils/formatDate';
import { ChangeCell } from './ChangeCell';
import type { ChangeHistoryEntry } from '../types';

const time = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

/** One line per entry; the row's drawer has the rest. */
export const historyColumns: DataColumn<ChangeHistoryEntry, never>[] = [
  {
    label: 'When',
    className: 'w-32 whitespace-nowrap text-xs tabular-nums',
    skeleton: 'w-24',
    cell: (e) => (
      <span>
        {formatDate(e.at)} <span className="text-muted-foreground">{time(e.at)}</span>
      </span>
    ),
  },
  { label: 'User', className: 'w-36 max-w-36 truncate text-xs', skeleton: 'w-24', cell: (e) => <span title={e.user}>{e.user}</span> },
  {
    label: 'Record',
    className: 'w-72 max-w-72',
    wideOnCard: true,
    skeleton: 'w-40',
    cell: (e) => (
      <span className="flex min-w-0 items-center gap-1.5 text-xs" title={e.recordType ?? undefined}>
        {e.page && <span className="shrink-0 rounded bg-secondary px-1.5 py-px text-2xs font-semibold text-secondary-foreground">{e.page}</span>}
        <span className="truncate font-medium">{e.recordLabel ?? `#${e.recordId}`}</span>
      </span>
    ),
  },
  { label: 'Change', className: 'max-w-0 w-full', skeleton: 'w-56', wideOnCard: true, cell: (e) => <ChangeCell entry={e} /> },
];
