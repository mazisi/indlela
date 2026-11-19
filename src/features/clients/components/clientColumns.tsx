import { Link } from 'react-router';
import type { DataColumn } from '@/components/table/DataTable';
import { ActiveStatus } from '@/components/table/ActiveStatus';
import { formatDate } from '@/utils/formatDate';
import type { Client, ClientSortKey } from '../types';

export const clientColumns: DataColumn<Client, ClientSortKey>[] = [
  {
    label: 'Client',
    sortKey: 'name',
    skeleton: 'w-40',
    cell: (c) => (
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-semibold">{c.name}</span>
        {c.notes && <span className="line-clamp-1 max-w-sm text-xs text-muted-foreground">{c.notes}</span>}
      </span>
    ),
  },
  {
    label: 'Contact',
    sortKey: 'contact_name',
    skeleton: 'w-32',
    cell: (c) =>
      c.contactName || c.contactEmail ? (
        <span className="flex min-w-0 flex-col text-xs">
          <span className="truncate">{c.contactName ?? '—'}</span>
          {c.contactEmail && <span className="truncate text-muted-foreground">{c.contactEmail}</span>}
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    label: 'Sites',
    skeleton: 'w-8',
    align: 'right',
    cell: (c) => (
      <Link to={`/dashboard/clients/sites?clientId=${c.id}`} className="tabular-nums text-primary hover:underline" aria-label={`Sites of ${c.name}`}>
        {c.sitesCount ?? 0}
      </Link>
    ),
  },
  { label: 'Added', sortKey: 'created_at', skeleton: 'w-20', cell: (c) => <span className="text-xs tabular-nums">{c.createdAt ? formatDate(c.createdAt) : '—'}</span> },
  { label: 'Status', sortKey: 'status', skeleton: 'w-14', hideOnCard: true, cell: (c) => <ActiveStatus active={c.isActive} /> },
];
