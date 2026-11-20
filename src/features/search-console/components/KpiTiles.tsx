import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { METRICS, type MetricKey } from '../lib/metrics';
import type { Totals } from '../types';
import { ChangeBadge } from './ChangeBadge';

interface Props {
  totals: Totals;
  compareTotals: Totals | null;
  /** e.g. "previous period"; empty when not comparing. */
  compareLabel: string;
  /** The metric the chart shows; tiles are its toggle. */
  selected: MetricKey;
  onSelect: (metric: MetricKey) => void;
}

/**
 * Clicks, impressions, CTR and position for the period, each with its change
 * against the compare period. A tile picks the metric the chart draws.
 */
export function KpiTiles({ totals, compareTotals, compareLabel, selected, onSelect }: Props) {
  return (
    <div role="group" aria-label="Performance summary · choose the metric to chart" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {METRICS.map((m) => {
        const active = m.key === selected;
        const previous = compareTotals?.[m.key];
        return (
          <button
            key={m.key}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(m.key)}
            className={cn(
              'group relative overflow-hidden rounded border bg-card px-4 py-3 text-left shadow-xs transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active ? 'border-primary/50 ring-1 ring-primary/30' : 'hover:border-primary/30 hover:bg-accent/30',
            )}
          >
            <span aria-hidden className={cn('absolute inset-x-0 top-0 h-0.5', active ? 'bg-primary' : 'bg-transparent')} />
            <span className="block truncate text-2xs font-semibold uppercase tracking-wider text-muted-foreground">{m.title}</span>
            <span className="mt-1 block text-xl font-bold leading-tight tabular-nums text-foreground">{m.format(totals[m.key])}</span>
            <span className="mt-1 flex min-h-5 flex-wrap items-center gap-1.5">
              {compareTotals ? (
                <>
                  <ChangeBadge value={m.change(totals, compareTotals)} better={m.better} format={m.changeFormat} label={m.title} context={`vs ${compareLabel}`} />
                  <span className="truncate text-xs text-muted-foreground" title={`${compareLabel}: ${previous !== undefined ? m.format(previous) : '—'}`}>
                    vs {previous !== undefined ? m.format(previous) : '—'}
                  </span>
                </>
              ) : (
                <span className="truncate text-xs text-muted-foreground">{m.hint}</span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function KpiTilesSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-busy="true" aria-label="Loading the summary">
      {METRICS.map((m, i) => (
        <div key={m.key} className="space-y-2 rounded border bg-card px-4 py-3">
          <Skeleton className={cn('h-3 rounded', ['w-14', 'w-24', 'w-24', 'w-28'][i])} />
          <Skeleton className={cn('h-6 rounded', ['w-16', 'w-20', 'w-12', 'w-10'][i])} />
          <div className="flex gap-1.5">
            <Skeleton className="h-5 w-14 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
