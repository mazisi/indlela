import { ExternalLink } from 'lucide-react';
import type { DataColumn } from '@/components/table/DataTable';
import { ActiveStatus } from '@/components/table/ActiveStatus';
import { formatDate } from '@/utils/formatDate';
import type { Site, SiteSortKey } from '../types';

export const siteColumns: DataColumn<Site, SiteSortKey>[] = [
  {
    label: 'Site',
    sortKey: 'name',
    skeleton: 'w-40',
    cell: (s) => <span className="truncate font-semibold">{s.name}</span>,
  },
  {
    label: 'Domain',
    sortKey: 'domain',
    skeleton: 'w-36',
    cell: (s) => (
      <a href={s.url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline">
        {s.domain}
        <ExternalLink className="size-3" aria-hidden />
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    ),
  },
  { label: 'Client', skeleton: 'w-32', cell: (s) => <span className="truncate text-xs">{s.client?.name ?? '—'}</span> },
  { label: 'Added', sortKey: 'created_at', skeleton: 'w-20', cell: (s) => <span className="text-xs tabular-nums">{s.createdAt ? formatDate(s.createdAt) : '—'}</span> },
  { label: 'Status', sortKey: 'status', skeleton: 'w-14', hideOnCard: true, cell: (s) => <ActiveStatus active={s.isActive} /> },
];
