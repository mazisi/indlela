import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart';
import { formatDate } from '@/utils/formatDate';
import { formatRank } from '../../lib/position';
import type { HistoryPoint } from '../../types';

const config = { position: { label: 'Position', color: 'var(--chart-current)' } } satisfies ChartConfig;

const shortDate = (ymd: string) => new Date(`${ymd.slice(0, 10)}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

/**
 * A keyword's position by check with 1 at the top (up = better). Checks out
 * of the top 100 are gaps in the line, never drawn as position 100.
 */
export function PositionHistoryChart({ points }: { points: HistoryPoint[] }) {
  const ranked = points.filter((p) => p.position);
  if (ranked.length === 0) {
    return <p className="rounded border border-dashed px-3 py-10 text-center text-sm text-muted-foreground">Not in the top 100 on any check in this period.</p>;
  }
  const best = Math.min(...ranked.map((p) => p.position as number));
  const first = points[0];
  const last = points[points.length - 1];
  const sparse = points.length <= 14;

  return (
    <div
      role="img"
      data-testid="position-history"
      aria-label={`Position from ${formatDate(first.date)} to ${formatDate(last.date)}: now ${last.position ? formatRank(last.position) : 'not in the top 100'}, best ${best}. ${points.length - ranked.length} checks out of the top 100.`}
    >
      <ChartContainer config={config} className="aspect-auto h-52 w-full">
        <LineChart data={points} margin={{ top: 6, right: 12, bottom: 0, left: 0 }} accessibilityLayer>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={28} tickFormatter={shortDate} />
          <YAxis width={32} tickLine={false} axisLine={false} tickMargin={4} reversed domain={[1, 'auto']} allowDecimals={false} />
          <ChartTooltip
            cursor={{ stroke: 'var(--border)', strokeWidth: 1 }}
            content={({ active, payload }) => {
              const p = active ? (payload?.[0]?.payload as HistoryPoint | undefined) : undefined;
              if (!p) return null;
              return (
                <div className="grid min-w-36 gap-1 rounded border bg-popover px-2.5 py-2 text-xs text-popover-foreground shadow-md">
                  <span className="text-muted-foreground">{formatDate(p.date)}</span>
                  <span className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-chart-current" aria-hidden />
                      Position
                    </span>
                    <span className="font-semibold tabular-nums">{p.position ? formatRank(p.position) : 'Not in top 100'}</span>
                  </span>
                </div>
              );
            }}
          />
          <Line
            dataKey="position"
            type="linear"
            connectNulls={false}
            stroke="var(--color-position)"
            strokeWidth={2}
            dot={sparse ? { r: 3, strokeWidth: 2, stroke: 'var(--card)', fill: 'var(--color-position)' } : false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--card)' }}
            isAnimationActive={false}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}
