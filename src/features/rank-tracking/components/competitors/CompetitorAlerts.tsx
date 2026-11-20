import { useState } from 'react';
import { ArrowRight, BellRing, Mail, MailCheck, Pencil, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Paginator } from '@/components/Paginator';
import { DataTable, DataTableSkeleton, type DataColumn } from '@/components/table/DataTable';
import { cn } from '@/lib/utils';
import { DEFAULT_PER_PAGE } from '@/types/pagination';
import { formatDate } from '@/utils/formatDate';
import { useCompetitorAlerts, useCompetitorSettings } from '../../hooks/useCompetitors';
import type { CompetitorAlert } from '../../types';
import { DeviceIcon, Rank } from '../cells';
import { LoadError } from '../LoadError';
import { AlertRecipientsSheet } from './AlertRecipientsSheet';

const NO_RECIPIENTS: string[] = [];

/** "#3 vs your #5" as a pair of positions. */
function Standing({ theirs, ours, tone }: { theirs: number | null; ours: number | null; tone?: 'bad' }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm whitespace-nowrap">
      <span className={cn('rounded px-1.5 py-px', tone === 'bad' ? 'bg-bad-soft text-bad' : 'bg-muted')}>
        <Rank position={theirs} />
      </span>
      <span className="text-xs text-muted-foreground">vs your</span>
      <Rank position={ours} />
    </span>
  );
}

const columns: DataColumn<CompetitorAlert, string>[] = [
  {
    label: 'Keyword',
    skeleton: 'w-40',
    cell: (a) => (
      <span className="block min-w-0 max-w-64">
        <span className="block truncate text-sm font-medium">{a.keyword.keyword}</span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="truncate">{a.keyword.locationName}</span>
          <DeviceIcon device={a.keyword.device} />
        </span>
      </span>
    ),
  },
  { label: 'Date', skeleton: 'w-16', cell: (a) => <span className="text-sm tabular-nums">{formatDate(a.checkedOn)}</span> },
  {
    label: 'Competitor',
    skeleton: 'w-28',
    cell: (a) => (
      <span className="block min-w-0 max-w-48">
        <span className="block truncate text-sm">{a.competitor.name}</span>
        {a.competitor.name !== a.competitor.domain && <span className="block truncate text-xs text-muted-foreground">{a.competitor.domain}</span>}
      </span>
    ),
  },
  {
    label: 'Overtook you',
    skeleton: 'w-40',
    wideOnCard: true,
    cell: (a) => (
      <span className="inline-flex flex-wrap items-center gap-1.5">
        <span className="sr-only">Before:</span>
        <Standing theirs={a.previousTheirPosition} ours={a.previousOurPosition} />
        <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden />
        <span className="sr-only">Now:</span>
        <Standing theirs={a.theirPosition} ours={a.ourPosition} tone="bad" />
      </span>
    ),
  },
  {
    label: 'Email',
    skeleton: 'w-20',
    cell: (a) =>
      a.emailedAt ? (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground" title={`Emailed ${formatDate(a.emailedAt)}`}>
          <MailCheck className="size-3.5 text-ok" aria-hidden />
          Sent {formatDate(a.emailedAt)}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">Not emailed</span>
      ),
  },
];

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/**
 * Overtake alerts, newest first: a competitor moved above the site on a key
 * keyword. The header says who gets the morning email; managers edit that list.
 */
export function CompetitorAlerts({ siteId, canManage, keyKeywords }: { siteId: number; canManage: boolean; keyKeywords: number }) {
  const [paging, setPaging] = useState({ page: 1, perPage: DEFAULT_PER_PAGE });
  const [editing, setEditing] = useState(false);
  const alerts = useCompetitorAlerts(siteId, paging);
  const settings = useCompetitorSettings(siteId);
  const recipients = settings.data?.alertRecipients ?? NO_RECIPIENTS;
  const rows = alerts.data?.data ?? [];
  const meta = alerts.data?.meta;

  return (
    <section className="rounded border bg-card shadow-xs" aria-labelledby="competitor-alerts-title">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5">
        <div className="min-w-0">
          <h2 id="competitor-alerts-title" className="flex items-center gap-1.5 text-sm font-semibold">
            <BellRing className="size-4 text-primary" aria-hidden />
            Overtake alerts
          </h2>
          <p className="text-xs text-muted-foreground">When a competitor moves above you on a key keyword. {plural(keyKeywords, 'key keyword')} watched.</p>
        </div>
        <div className="flex items-center gap-2" data-testid="alert-emails">
          {settings.isPending ? (
            <Skeleton className="h-3.5 w-36 rounded" />
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground" title={recipients.join(', ') || undefined}>
              <Mail className="size-3.5" aria-hidden />
              Alert emails: <span className="font-semibold text-foreground">{recipients.length ? plural(recipients.length, 'recipient') : 'off'}</span>
            </span>
          )}
          {canManage && (
            <Button variant="outline" size="sm" className="h-7" onClick={() => setEditing(true)} disabled={settings.isPending}>
              <Pencil />
              Edit
            </Button>
          )}
        </div>
      </header>

      <div className="p-4">
        {keyKeywords === 0 && (
          <p className="mb-3 flex items-center gap-2 rounded border border-primary/20 bg-accent/50 px-3 py-2 text-sm">
            <Star className="size-4 shrink-0 text-primary" aria-hidden />
            Alerts only watch key keywords. Star the searches that matter most on the Keywords tab.
          </p>
        )}
        {alerts.isError ? (
          <LoadError error={alerts.error} what="the alerts" onRetry={() => alerts.refetch()} />
        ) : alerts.isPending ? (
          <DataTableSkeleton columns={columns} rows={3} label="Loading the alerts" selectable={false} actions={false} />
        ) : rows.length === 0 ? (
          <p className="rounded border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">No competitor has overtaken you on a key keyword yet.</p>
        ) : (
          <div className={cn('transition-opacity', alerts.isFetching && 'opacity-60')}>
            <DataTable rows={rows} columns={columns} rowLabel={(a) => `${a.keyword.keyword}: ${a.competitor.name}`} noun="alerts" />
            {meta && (
              <Paginator
                currentPage={meta.currentPage}
                lastPage={meta.lastPage}
                totalItems={meta.total}
                perPage={meta.perPage}
                onPageChange={(page) => setPaging((p) => ({ ...p, page }))}
                onPerPageChange={(perPage) => setPaging({ page: 1, perPage })}
              />
            )}
          </div>
        )}
      </div>

      {canManage && <AlertRecipientsSheet siteId={siteId} recipients={recipients} open={editing} onOpenChange={setEditing} />}
    </section>
  );
}
