import { formatNumber } from '@/features/search-console/lib/format';
import { ChangeBadge } from '@/features/search-console/components/ChangeBadge';
import { DISTRIBUTION_SEGMENTS } from '../../lib/position';
import type { Distribution } from '../../types';

/** One hue, darkest for the best bucket; "not ranking" is neutral grey. */
const FILL: Record<keyof Distribution, string> = {
  top3: 'var(--chart-current)',
  top10: 'color-mix(in oklab, var(--chart-current) 70%, var(--card))',
  top20: 'color-mix(in oklab, var(--chart-current) 45%, var(--card))',
  top100: 'color-mix(in oklab, var(--chart-current) 25%, var(--card))',
  notRanking: 'color-mix(in oklab, var(--chart-compare) 35%, var(--card))',
};

/**
 * How the tracked keywords spread over Google's pages: one stacked bar
 * (best bucket first), with each bucket's count and its change over the week
 * in the legend, which also carries the figures for screen readers.
 */
export function DistributionBar({ distribution, before }: { distribution: Distribution; before: Distribution | null }) {
  const total = DISTRIBUTION_SEGMENTS.reduce((n, s) => n + distribution[s.key], 0);

  return (
    <section className="rounded border bg-card shadow-xs" aria-labelledby="rank-distribution-title">
      <header className="flex items-baseline justify-between gap-2 border-b px-4 py-2.5">
        <h2 id="rank-distribution-title" className="text-sm font-semibold">
          Ranking distribution
        </h2>
        <p className="text-xs text-muted-foreground">{formatNumber(total)} keywords</p>
      </header>
      <div className="space-y-3 p-4">
        <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-muted" aria-hidden>
          {total > 0 &&
            DISTRIBUTION_SEGMENTS.filter((s) => distribution[s.key] > 0).map((s) => (
              <span
                key={s.key}
                className="h-full first:rounded-l-full last:rounded-r-full"
                style={{ width: `${(distribution[s.key] / total) * 100}%`, background: FILL[s.key] }}
                title={`${s.label}: ${formatNumber(distribution[s.key])}`}
              />
            ))}
        </div>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3" aria-label="Keywords by position">
          {DISTRIBUTION_SEGMENTS.map((s) => (
            <li key={s.key} className="flex items-center justify-between gap-2 text-xs">
              <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                <span className="size-2.5 shrink-0 rounded-sm" style={{ background: FILL[s.key] }} aria-hidden />
                <span className="truncate">{s.label}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="font-semibold tabular-nums text-foreground">{formatNumber(distribution[s.key])}</span>
                {before && s.key !== 'notRanking' && (
                  <ChangeBadge value={distribution[s.key] - before[s.key]} format={(n) => formatNumber(n)} label={s.label} context="vs 7 days ago" className="px-1 py-0 text-2xs" />
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
