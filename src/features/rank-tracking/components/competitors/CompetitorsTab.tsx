import { useState } from 'react';
import { History, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTableSkeleton } from '@/components/table/DataTable';
import { formatDate } from '@/utils/formatDate';
import { useCompetitorOverview, useCompetitors } from '../../hooks/useCompetitors';
import { MAX_COMPETITORS, competitorColors, historyIsRecent, sovSeries } from '../../lib/competitors';
import type { Competitor, CompetitorOverview } from '../../types';
import { LoadError } from '../LoadError';
import { VisibilityChartSkeleton } from '../summary/VisibilityChart';
import { AddCompetitorSheet } from './AddCompetitorSheet';
import { CompetitorAlerts } from './CompetitorAlerts';
import { CompetitorsEmptyState } from './CompetitorsEmptyState';
import { competitorColumns } from './competitorColumns';
import { CompetitorsTable } from './CompetitorsTable';
import { HeadToHeadTable } from './HeadToHeadTable';
import { ShareOfVoiceCard } from './ShareOfVoiceCard';
import { SovTrendChart } from './SovTrendChart';

interface Props {
  siteId: number;
  /** The site's address: its own domain can't be a competitor. */
  siteUrl: string;
  /** Active keywords, for the empty state's suggestions. */
  keywordsCount: number;
  canManage: boolean;
}

/**
 * Competitor tracking for one site: share of voice (now and by week), the
 * competitors with their standing, the head-to-head per keyword, and overtake
 * alerts. Managers add (up to five active), rename, pause and remove.
 */
export function CompetitorsTab({ siteId, siteUrl, keywordsCount, canManage }: Props) {
  const [adding, setAdding] = useState(false);
  const list = useCompetitors(siteId);
  const competitors = list.data ?? [];
  const hasAny = competitors.length > 0;
  const overview = useCompetitorOverview(siteId, hasAny);

  return (
    <>
      {list.isPending ? (
        <CompetitorsSkeleton />
      ) : list.isError ? (
        <LoadError error={list.error} what="the competitors" onRetry={() => list.refetch()} />
      ) : !hasAny ? (
        <CompetitorsEmptyState siteId={siteId} keywordsTotal={keywordsCount} canManage={canManage} onAdd={() => setAdding(true)} />
      ) : (
        <CompetitorsContent
          siteId={siteId}
          competitors={competitors}
          overview={overview.data}
          overviewState={overview.isError ? { error: overview.error, retry: () => void overview.refetch() } : undefined}
          canManage={canManage}
          onAdd={() => setAdding(true)}
        />
      )}
      {canManage && <AddCompetitorSheet siteId={siteId} siteUrl={siteUrl} competitors={competitors} open={adding} onOpenChange={setAdding} />}
    </>
  );
}

interface ContentProps {
  siteId: number;
  competitors: Competitor[];
  overview: CompetitorOverview | undefined;
  overviewState?: { error: unknown; retry: () => void };
  canManage: boolean;
  onAdd: () => void;
}

function CompetitorsContent({ siteId, competitors, overview, overviewState, canManage, onAdd }: ContentProps) {
  const colors = competitorColors(competitors);
  const active = competitors.filter((c) => c.isActive).sort((a, b) => a.id - b.id);
  const full = active.length >= MAX_COMPETITORS;
  const series = overview ? sovSeries(overview, colors) : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold tabular-nums text-foreground">
            {active.length} of {MAX_COMPETITORS}
          </span>{' '}
          active competitors, tracked on this site’s keywords.
        </p>
        {canManage && (
          <Button size="sm" onClick={onAdd} disabled={full} title={full ? 'Pause or remove a competitor to add another.' : undefined}>
            <Plus />
            Add competitor
          </Button>
        )}
      </div>

      {overview && historyIsRecent(overview.historySince) && (
        <p className="flex items-center gap-2 rounded border border-primary/20 bg-accent/50 px-3 py-2 text-sm" data-testid="history-since">
          <History className="size-4 shrink-0 text-primary" aria-hidden />
          Competitor history starts on {formatDate(overview.historySince as string)}; earlier weeks show your share only.
        </p>
      )}

      {overviewState ? (
        <LoadError error={overviewState.error} what="share of voice" onRetry={overviewState.retry} />
      ) : !overview ? (
        <SovSkeleton />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <ShareOfVoiceCard series={series} keywordsTotal={overview.keywordsTotal} />
          <SovTrendChart trend={overview.trend} series={series} />
        </div>
      )}

      <section className="space-y-3" aria-labelledby="competitors-title">
        <h2 id="competitors-title" className="text-sm font-semibold">
          Competitors
        </h2>
        <CompetitorsTable siteId={siteId} competitors={competitors} colors={colors} canManage={canManage} />
      </section>

      {active.length > 0 ? (
        <HeadToHeadTable siteId={siteId} competitors={active.map((c) => ({ id: c.id, name: c.name, color: colors.get(c.id) ?? 'var(--chart-compare)' }))} />
      ) : (
        <p className="rounded border border-dashed bg-card px-3 py-6 text-center text-sm text-muted-foreground">Every competitor is paused. Resume one to see the head-to-head.</p>
      )}

      <CompetitorAlerts siteId={siteId} canManage={canManage} keyKeywords={overview?.keyKeywords ?? 0} />
    </div>
  );
}

/** The share-of-voice card's shape: header, the bar, and its legend rows. */
function SovSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded border bg-card" aria-busy="true" aria-label="Loading share of voice">
        <div className="space-y-1.5 border-b px-4 py-3">
          <Skeleton className="h-3.5 w-28 rounded" />
          <Skeleton className="h-3 w-64 rounded" />
        </div>
        <div className="space-y-4 p-4">
          <div className="flex h-7 gap-0.5">
            {[38, 24, 18, 12, 8].map((w) => (
              <Skeleton key={w} className="h-full rounded" style={{ width: `${w}%` }} />
            ))}
          </div>
          <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5">
                  <Skeleton className="size-2.5 rounded-sm" />
                  <Skeleton className="h-3 w-24 rounded" />
                </span>
                <Skeleton className="h-3 w-20 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <VisibilityChartSkeleton />
    </div>
  );
}

function CompetitorsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3.5 w-64 rounded" />
        <Skeleton className="h-8 w-36 rounded" />
      </div>
      <SovSkeleton />
      <DataTableSkeleton columns={competitorColumns(new Map())} rows={3} label="Loading the competitors" selectable={false} actions={false} />
    </div>
  );
}
