import { usageLevel, usagePercent, type UsageLevel } from '@/features/rank-tracking/lib/usage';
import { formatNumber } from '@/features/search-console/lib/format';
import { cn } from '@/lib/utils';
import { formatUsd, monthLabel } from '../lib/format';
import type { MonthCost, WorkspaceUsage } from '../types';

const BAR: Record<UsageLevel, string> = { ok: 'bg-primary', near: 'bg-warn', full: 'bg-bad' };

/** "120 / 500" over a thin meter (amber from 80 %, red at the limit), with a "custom" chip when staff set the limit. */
export function KeywordUsage({ row }: { row: WorkspaceUsage }) {
  const level = usageLevel(row.keywordsTracked, row.keywordLimit);
  const pct = usagePercent(row.keywordsTracked, row.keywordLimit);
  return (
    <div className="w-32 space-y-1">
      <div className="flex items-center gap-1.5 text-sm">
        <span className="tabular-nums">
          <span className="font-semibold">{formatNumber(row.keywordsTracked)}</span>
          <span className="text-muted-foreground"> / {formatNumber(row.keywordLimit)}</span>
        </span>
        {row.keywordLimitOverride !== null && (
          <span className="rounded border bg-accent px-1 text-2xs font-medium text-primary" title="This workspace has its own limit">
            custom
          </span>
        )}
      </div>
      <div
        role="progressbar"
        aria-label={`Keywords tracked by ${row.name}`}
        aria-valuemin={0}
        aria-valuemax={row.keywordLimit}
        aria-valuenow={Math.min(row.keywordsTracked, row.keywordLimit)}
        aria-valuetext={`${formatNumber(row.keywordsTracked)} of ${formatNumber(row.keywordLimit)} (${pct}%)`}
        data-level={level}
        className="h-1 overflow-hidden rounded-full bg-muted"
      >
        <div className={cn('h-full rounded-full', BAR[level])} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/**
 * Six tiny bars (one per month, oldest first, the latest solid), scaled to
 * the workspace's own busiest month. Figures are in its accessible name.
 */
export function CostSparkline({ series, width = 72, height = 22 }: { series: MonthCost[]; width?: number; height?: number }) {
  const max = Math.max(0, ...series.map((p) => p.cost));
  if (series.length === 0 || max === 0) return <span className="text-xs text-muted-foreground">No cost yet</span>;
  const gap = 2;
  const barW = (width - gap * (series.length - 1)) / series.length;
  const summary = `Cost by month: ${series.map((p) => `${monthLabel(p.month)} ${formatUsd(p.cost)}`).join(', ')}.`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={summary} data-testid="cost-sparkline">
      <title>{summary}</title>
      {series.map((p, i) => {
        // A month with any cost stays visible (at least 2px); none sits on the baseline.
        const h = p.cost > 0 ? Math.max(2, (p.cost / max) * height) : 1;
        return (
          <rect
            key={p.month}
            x={i * (barW + gap)}
            y={height - h}
            width={barW}
            height={h}
            rx={1}
            fill={p.cost > 0 ? 'var(--chart-current)' : 'var(--border)'}
            fillOpacity={p.cost > 0 && i < series.length - 1 ? 0.4 : 1}
          />
        );
      })}
    </svg>
  );
}
