import type { ReactNode } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime } from '@/utils/formatDate';
import { cn } from '@/lib/utils';
import { isAlertEvent } from '../lib/loginEvents';
import type { LoginEvent } from '../types';

const COLUMNS = ['When', 'User', 'Event', 'Details'] as const;

function EventLabel({ event }: { event: LoginEvent }) {
  return (
    <span className={cn('font-medium', isAlertEvent(event.event) ? 'text-bad' : 'text-foreground')}>{event.eventLabel}</span>
  );
}

function UserCell({ event }: { event: LoginEvent }) {
  return (
    <div className="min-w-0">
      <div className="truncate font-medium text-foreground">{event.user ?? 'No account'}</div>
      <div className="truncate text-xs text-muted-foreground">{event.email}</div>
    </div>
  );
}

// One label:value pair on the mobile card.
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-2xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="truncate text-sm">{children}</dd>
    </div>
  );
}

/** Desktop table from md up; one card per row below. */
export function LoginHistoryTable({ events }: { events: LoginEvent[] }) {
  return (
    <>
      <div className="hidden rounded border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {COLUMNS.map((c) => (
                <TableHead key={c} className="px-3 text-2xs font-semibold uppercase tracking-wider">
                  {c}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="px-3 font-mono text-xs tabular-nums">{formatDateTime(e.at)}</TableCell>
                <TableCell className="max-w-72 px-3">
                  <UserCell event={e} />
                </TableCell>
                <TableCell className="px-3">
                  <EventLabel event={e} />
                </TableCell>
                <TableCell className="px-3 text-xs text-muted-foreground">
                  {e.note ?? '—'}
                  {e.ipAddress && <span className="ml-2 font-mono text-muted-foreground/70">{e.ipAddress}</span>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="space-y-2 md:hidden">
        {events.map((e) => (
          <li key={e.id} className="rounded border bg-card p-3">
            <div className="flex items-start justify-between gap-3">
              <UserCell event={e} />
              <span className="shrink-0 font-mono text-2xs tabular-nums text-muted-foreground">{formatDateTime(e.at)}</span>
            </div>
            <dl className="mt-2 grid grid-cols-2 gap-2">
              <Field label="Event">
                <EventLabel event={e} />
              </Field>
              <Field label="Details">{e.note ?? '—'}</Field>
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}

/** Same columns and cell shapes as the real table. */
export function LoginHistoryTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <>
      <div className="hidden rounded border bg-card md:block" aria-busy="true" aria-label="Loading login history">
        <Table>
          <TableHeader>
            <TableRow>
              {COLUMNS.map((c) => (
                <TableHead key={c} className="px-3 text-2xs font-semibold uppercase tracking-wider">
                  {c}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, i) => (
              <TableRow key={i}>
                <TableCell className="px-3">
                  <Skeleton className="h-3.5 w-28 rounded" />
                </TableCell>
                <TableCell className="px-3">
                  <Skeleton className="h-3.5 w-32 rounded" />
                  <Skeleton className="mt-1.5 h-3 w-44 rounded" />
                </TableCell>
                <TableCell className="px-3">
                  <Skeleton className="h-3.5 w-24 rounded" />
                </TableCell>
                <TableCell className="px-3">
                  <Skeleton className="h-3 w-36 rounded" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ul className="space-y-2 md:hidden" aria-busy="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i} className="space-y-2 rounded border bg-card p-3">
            <Skeleton className="h-3.5 w-32 rounded" />
            <Skeleton className="h-3 w-44 rounded" />
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Skeleton className="h-3.5 w-24 rounded" />
              <Skeleton className="h-3.5 w-28 rounded" />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
