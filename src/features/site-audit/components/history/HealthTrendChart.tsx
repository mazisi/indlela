import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/utils/formatDate';
import { healthBand } from '../../lib/health';
import { trendPoints, type TrendPoint as Point } from '../../lib/trend';
import type { Audit } from '../../types';

const shortDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

const config = { score: { label: 'Health score', color: 'var(--chart-current)' } } satisfies ChartConfig;

/**
 * The health score over the site's recent audits: one series on a fixed
 * 0–100 axis (so small moves don't look dramatic), the audits table below
 * carrying the same figures.
 */
export function HealthTrendChart({ audits }: { audits: Audit[] }) {
  const data = trendPoints(audits);

  return (
    <section className="rounded border bg-card shadow-xs" aria-labelledby="audit-trend-title">
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b px-4 py-2.5">
        <h3 id="audit-trend-title" className="text-sm font-semibold">
          Health score over time
        </h3>
        <p className="text-xs text-muted-foreground">Last {data.length} finished {data.length === 1 ? 'audit' : 'audits'}</p>
      </header>
      {data.length < 2 ? (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">The trend appears after the second finished audit.</p>
      ) : (
        <div
          className="px-2 pb-2 pt-4"
          role="img"
          aria-label={`Health score from ${data[0].score} on ${formatDate(data[0].date)} to ${data[data.length - 1].score} on ${formatDate(data[data.length - 1].date)}. The table below lists every audit.`}
        >
          <ChartContainer config={config} className="aspect-auto h-48 w-full">
            <LineChart data={data} margin={{ top: 6, right: 12, bottom: 0, left: 0 }} accessibilityLayer>
              <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} tickFormatter={shortDate} />
              <YAxis width={32} tickLine={false} axisLine={false} tickMargin={4} domain={[0, 100]} ticks={[0, 50, 80, 100]} />
              <ChartTooltip
                cursor={{ stroke: 'var(--border)', strokeWidth: 1 }}
                content={({ active, payload }) => {
                  const p = active ? (payload?.[0]?.payload as Point | undefined) : undefined;
                  if (!p) return null;
                  return (
                    <div className="grid min-w-36 gap-1 rounded border bg-popover px-2.5 py-2 text-xs text-popover-foreground shadow-md">
                      <span className="text-muted-foreground">{formatDate(p.date)}</span>
                      <span className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-1.5">
                          <span className="size-2 rounded-full bg-chart-current" aria-hidden />
                          Health score
                        </span>
                        <span className="font-semibold tabular-nums">
                          {p.score} · {healthBand(p.score).label}
                        </span>
                      </span>
                    </div>
                  );
                }}
              />
              <Line
                dataKey="score"
                type="monotone"
                stroke="var(--color-score)"
                strokeWidth={2}
                dot={{ r: 3, strokeWidth: 2, stroke: 'var(--card)', fill: 'var(--color-score)' }}
                activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--card)' }}
                isAnimationActive={false}
              />
            </LineChart>
          </ChartContainer>
        </div>
      )}
    </section>
  );
}

export function HealthTrendSkeleton() {
  return (
    <div className="rounded border bg-card" aria-busy="true" aria-label="Loading the trend">
      <div className="flex justify-between border-b px-4 py-3">
        <Skeleton className="h-3.5 w-40 rounded" />
        <Skeleton className="h-3 w-28 rounded" />
      </div>
      <div className="relative h-48">
        {[0, 1, 2].map((i) => (
          <div key={i} className="absolute inset-x-10 border-t border-muted" style={{ top: `${20 + i * 30}%` }} />
        ))}
      </div>
    </div>
  );
}
