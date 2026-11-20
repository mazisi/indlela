import { useState } from 'react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { Table2, LineChart as LineChartIcon } from 'lucide-react';
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TABLE_HEAD } from '@/components/table/tableStyles';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/formatDate';
import { fromYmd } from '../lib/dateRange';
import { metricDef, type MetricKey } from '../lib/metrics';
import type { SeriesPoint } from '../types';

interface Props {
  metric: MetricKey;
  series: SeriesPoint[];
  compareSeries: SeriesPoint[] | null;
  /** e.g. "Previous period". */
  compareLabel: string;
}

interface Point {
  date: string;
  /** null: no impressions that day (position only), drawn as a gap. */
  current: number | null;
  compareDate?: string;
  compare?: number | null;
}

const config = {
  current: { label: 'This period', color: 'var(--chart-current)' },
  compare: { label: 'Compare', color: 'var(--chart-compare)' },
} satisfies ChartConfig;

const shortDate = (ymd: string, long: boolean) =>
  fromYmd(ymd).toLocaleDateString('en-GB', long ? { month: 'short', year: '2-digit' } : { day: 'numeric', month: 'short' });

/** The compare period lined up day for day under the current one (day 1 with day 1…). */
function mergeSeries(metric: MetricKey, series: SeriesPoint[], compare: SeriesPoint[] | null): Point[] {
  return series.map((p, i) => {
    const c = compare?.[i];
    return { date: p.date, current: p[metric], ...(c ? { compareDate: c.date, compare: c[metric] } : {}) };
  });
}

function Swatch({ dashed, color }: { dashed?: boolean; color: string }) {
  return (
    <svg width="18" height="8" aria-hidden className="shrink-0">
      <line x1="1" y1="4" x2="17" y2="4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeDasharray={dashed ? '4 3' : undefined} />
    </svg>
  );
}

/**
 * One metric over time (one axis: the tiles above switch the metric), with
 * the compare period dashed and muted beneath it. Position is drawn with 1 at
 * the top, so up still means better. A table view carries the same numbers.
 */
export function PerformanceChart({ metric, series, compareSeries, compareLabel }: Props) {
  const [asTable, setAsTable] = useState(false);
  const def = metricDef(metric);
  const data = mergeSeries(metric, series, compareSeries);
  const hasCompare = Boolean(compareSeries?.length);
  const long = series.length > 120;

  return (
    <section className="rounded border bg-card shadow-xs" aria-labelledby="sc-chart-title">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5">
        <div className="min-w-0">
          <h2 id="sc-chart-title" className="text-sm font-semibold">
            {def.title} over time
          </h2>
          {metric === 'position' && <p className="text-xs text-muted-foreground">Higher on the chart is better (position 1 is the top of Google).</p>}
        </div>
        <div className="flex items-center gap-4">
          <ul className="flex items-center gap-3 text-xs text-muted-foreground" aria-label="Legend">
            <li className="flex items-center gap-1.5">
              <Swatch color="var(--chart-current)" />
              This period
            </li>
            {hasCompare && (
              <li className="flex items-center gap-1.5">
                <Swatch dashed color="var(--chart-compare)" />
                {compareLabel}
              </li>
            )}
          </ul>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setAsTable((v) => !v)} aria-pressed={asTable}>
            {asTable ? <LineChartIcon className="size-3.5" /> : <Table2 className="size-3.5" />}
            {asTable ? 'Chart' : 'Table'}
          </Button>
        </div>
      </header>

      {series.length === 0 ? (
        <p className="px-4 py-16 text-center text-sm text-muted-foreground">No data for these dates yet.</p>
      ) : asTable ? (
        <div className="max-h-72 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                <TableHead className={TABLE_HEAD}>Date</TableHead>
                <TableHead className={cn(TABLE_HEAD, 'text-right')}>{def.label}</TableHead>
                {hasCompare && <TableHead className={TABLE_HEAD}>Compare date</TableHead>}
                {hasCompare && <TableHead className={cn(TABLE_HEAD, 'text-right')}>{def.label} (compare)</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((p) => (
                <TableRow key={p.date}>
                  <TableCell className="px-3 tabular-nums">{formatDate(p.date)}</TableCell>
                  <TableCell className="px-3 text-right tabular-nums">{def.format(p.current)}</TableCell>
                  {hasCompare && <TableCell className="px-3 tabular-nums text-muted-foreground">{p.compareDate ? formatDate(p.compareDate) : '—'}</TableCell>}
                  {hasCompare && <TableCell className="px-3 text-right tabular-nums text-muted-foreground">{p.compare !== undefined ? def.format(p.compare) : '—'}</TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="px-2 pb-2 pt-4" role="img" aria-label={`${def.title} by day from ${formatDate(series[0].date)} to ${formatDate(series[series.length - 1].date)}. Use the Table button for the figures.`}>
          <ChartContainer config={config} className="aspect-auto h-64 w-full">
            <LineChart data={data} margin={{ top: 4, right: 12, bottom: 0, left: 4 }} accessibilityLayer>
              <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(d: string) => shortDate(d, long)}
              />
              <YAxis
                width={48}
                tickLine={false}
                axisLine={false}
                tickMargin={4}
                reversed={metric === 'position'}
                domain={metric === 'position' ? [1, 'auto'] : [0, 'auto']}
                allowDecimals={metric !== 'clicks' && metric !== 'impressions'}
                tickFormatter={(n: number) => def.tick(n)}
              />
              <ChartTooltip
                cursor={{ stroke: 'var(--border)', strokeWidth: 1 }}
                content={({ active, payload }) => {
                  const p = active ? (payload?.[0]?.payload as Point | undefined) : undefined;
                  if (!p) return null;
                  return (
                    <div className="grid min-w-44 gap-1.5 rounded border bg-popover px-2.5 py-2 text-xs text-popover-foreground shadow-md">
                      <div className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Swatch color="var(--chart-current)" />
                          {formatDate(p.date)}
                        </span>
                        <span className="font-semibold tabular-nums">{def.format(p.current)}</span>
                      </div>
                      {p.compareDate && p.compare !== undefined && (
                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Swatch dashed color="var(--chart-compare)" />
                            {formatDate(p.compareDate)}
                          </span>
                          <span className="tabular-nums text-muted-foreground">{def.format(p.compare)}</span>
                        </div>
                      )}
                    </div>
                  );
                }}
              />
              {hasCompare && (
                <Line
                  dataKey="compare"
                  type="monotone"
                  stroke="var(--color-compare)"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                  activeDot={{ r: 3, strokeWidth: 2, stroke: 'var(--card)' }}
                  isAnimationActive={false}
                />
              )}
              <Line
                dataKey="current"
                type="monotone"
                stroke="var(--color-current)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--card)' }}
                isAnimationActive={false}
              />
            </LineChart>
          </ChartContainer>
        </div>
      )}
    </section>
  );
}

export function PerformanceChartSkeleton() {
  return (
    <div className="rounded border bg-card" aria-busy="true" aria-label="Loading the chart">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="h-3.5 w-36 animate-pulse rounded bg-muted" />
        <div className="h-3 w-40 animate-pulse rounded bg-muted" />
      </div>
      {/* A flat line where the series will be, over the grid it will sit on. */}
      <div className="relative h-64 px-4 py-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="absolute inset-x-14 border-t border-muted" style={{ top: `${16 + i * 25}%` }} />
        ))}
        <svg className="absolute inset-x-14 top-[30%] h-[45%] w-[calc(100%-7rem)] text-muted" preserveAspectRatio="none" viewBox="0 0 100 40" aria-hidden>
          <path d="M0 30 C 15 22, 25 28, 40 18 S 65 24, 75 12 S 92 16, 100 8" fill="none" stroke="currentColor" strokeWidth="2.5" vectorEffect="non-scaling-stroke" className="animate-pulse" />
        </svg>
      </div>
    </div>
  );
}
