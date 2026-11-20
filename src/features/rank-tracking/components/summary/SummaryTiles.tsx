import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ChangeBadge } from '@/features/search-console/components/ChangeBadge';
import { formatDecimal, formatNumber, formatPosition } from '@/features/search-console/lib/format';
import { cn } from '@/lib/utils';
import { inTop10 } from '../../lib/position';
import { delta, pointDaysBefore } from '../../lib/summary';
import type { RankSummary } from '../../types';

function Tile({ label, value, foot }: { label: string; value: string; foot: ReactNode }) {
  return (
    <div className="min-w-0 rounded border bg-card px-4 py-3 shadow-xs">
      <p className="truncate text-2xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold leading-tight tabular-nums">{value}</p>
      <div className="mt-1 flex min-h-5 flex-wrap items-center gap-1.5 text-xs text-muted-foreground">{foot}</div>
    </div>
  );
}

const VS = 'vs 7 days ago';

/** Keywords tracked, average position, top 3, top 10 and visibility, each with its change over the week. */
export function SummaryTiles({ summary }: { summary: RankSummary }) {
  const weekAgo = pointDaysBefore(summary.visibilitySeries, 7);
  const before = summary.distribution7dAgo;
  const top10 = inTop10(summary.distribution);
  const change = (value: number | null, label: string, better: 'higher' | 'lower', format: (n: number) => string) =>
    value === null ? <span>No figures from a week ago yet</span> : (
      <>
        <ChangeBadge value={value} better={better} format={format} label={label} context={VS} />
        <span>{VS}</span>
      </>
    );
  const count = (n: number) => formatNumber(n);

  return (
    <div role="group" aria-label="Ranking summary" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      <Tile label="Keywords tracked" value={formatNumber(summary.keywordsCount)} foot={<span>Keyword × location × device</span>} />
      <Tile label="Avg position" value={formatPosition(summary.avgPosition)} foot={change(delta(summary.avgPosition, weekAgo?.avgPosition), 'Average position', 'lower', formatDecimal)} />
      <Tile label="Top 3" value={formatNumber(summary.distribution.top3)} foot={change(before ? summary.distribution.top3 - before.top3 : null, 'Top 3', 'higher', count)} />
      <Tile label="Top 10" value={formatNumber(top10)} foot={change(before ? top10 - inTop10(before) : null, 'Top 10', 'higher', count)} />
      <Tile
        label="Visibility"
        value={`${formatDecimal(summary.visibility)}%`}
        foot={change(delta(summary.visibility, weekAgo?.visibility), 'Visibility', 'higher', (n) => `${formatDecimal(n)} pts`)}
      />
    </div>
  );
}

export function SummaryTilesSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5" aria-busy="true" aria-label="Loading the summary">
      {['w-10', 'w-12', 'w-8', 'w-8', 'w-14'].map((w, i) => (
        <div key={i} className="space-y-2 rounded border bg-card px-4 py-3">
          <Skeleton className="h-3 w-20 rounded" />
          <Skeleton className={cn('h-6 rounded', w)} />
          <div className="flex gap-1.5">
            <Skeleton className="h-5 w-10 rounded" />
            <Skeleton className="h-4 w-20 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
