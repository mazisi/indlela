import { ArrowRight, CheckCircle2, Copy } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber } from '@/features/search-console/lib/format';
import { cn } from '@/lib/utils';
import type { Mover, RankSummary } from '../../types';
import { DistributionBar } from './DistributionBar';
import { MoversList } from './MoversList';
import { SerpFeatureCards } from './SerpFeatureCards';
import { SummaryTiles, SummaryTilesSkeleton } from './SummaryTiles';
import { VisibilityChart, VisibilityChartSkeleton } from './VisibilityChart';

function CannibalisationCard({ count, onOpen }: { count: number; onOpen: () => void }) {
  if (count === 0) {
    return (
      <div className="flex items-start gap-3 rounded border bg-card px-4 py-3 shadow-xs">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-ok" aria-hidden />
        <div className="text-sm">
          <p className="font-semibold">No cannibalisation</p>
          <p className="text-xs text-muted-foreground">Each keyword has one of the site's pages ranking for it.</p>
        </div>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-start gap-3 rounded border border-warn/30 bg-warn-soft/50 px-4 py-3 text-left shadow-xs transition-colors hover:border-warn/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Copy className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />
      <span className="min-w-0 flex-1 text-sm">
        <span className="block font-semibold">
          {formatNumber(count)} {count === 1 ? 'keyword has' : 'keywords have'} competing pages
        </span>
        <span className="block text-xs text-muted-foreground">Two or more of the site's pages rank for the same search and split its strength.</span>
      </span>
      <span className="flex shrink-0 items-center gap-1 self-center text-xs font-medium text-primary group-hover:underline">
        Review
        <ArrowRight className="size-3.5" aria-hidden />
      </span>
    </button>
  );
}

interface Props {
  summary: RankSummary;
  onOpenMover: (mover: Mover) => void;
  onOpenCannibalisation: () => void;
}

/** A site's rankings at a glance: tiles, the trend, the distribution, the week's movers and SERP features. */
export function RankSummaryPanel({ summary, onOpenMover, onOpenCannibalisation }: Props) {
  return (
    <div className="space-y-3">
      <SummaryTiles summary={summary} />
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <VisibilityChart series={summary.visibilitySeries} />
        </div>
        <div className="space-y-3">
          <DistributionBar distribution={summary.distribution} before={summary.distribution7dAgo} />
          <CannibalisationCard count={summary.cannibalisedCount} onOpen={onOpenCannibalisation} />
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <MoversList kind="gains" movers={summary.gains} onOpen={onOpenMover} />
        <MoversList kind="drops" movers={summary.drops} onOpen={onOpenMover} />
      </div>
      <SerpFeatureCards features={summary.serpFeatures} />
    </div>
  );
}

export function RankSummarySkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading the rankings">
      <SummaryTilesSkeleton />
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <VisibilityChartSkeleton />
        </div>
        <div className="space-y-3 rounded border bg-card p-4">
          <Skeleton className="h-3.5 w-36 rounded" />
          <Skeleton className="h-3 w-full rounded-full" />
          <div className="grid grid-cols-2 gap-2">
            {['w-16', 'w-12', 'w-14', 'w-16', 'w-20'].map((w, i) => (
              <Skeleton key={i} className={cn('h-3 rounded', w)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
