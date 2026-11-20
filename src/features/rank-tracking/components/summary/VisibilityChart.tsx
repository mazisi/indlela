import { useState } from 'react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { LineChart as LineChartIcon, Table2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Segmented } from '@/components/form/Segmented';
import { TABLE_HEAD } from '@/components/table/tableStyles';
import { formatDecimal, formatPosition } from '@/features/search-console/lib/format';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/formatDate';
import type { VisibilityPoint } from '../../types';

type Metric = 'visibility' | 'avgPosition';

const METRICS: Record<Metric, { title: string; format: (n: number | null) => string; tick: (n: number) => string }> = {
  visibility: { title: 'Visibility', format: (n) => (n === null ? '—' : `${formatDecimal(n)}%`), tick: (n) => `${n}%` },
  avgPosition: { title: 'Average position', format: (n) => formatPosition(n), tick: (n) => String(n) },
};

const config = { value: { label: 'Value', color: 'var(--chart-current)' } } satisfies ChartConfig;

const shortDate = (ymd: string) => new Date(`${ymd.slice(0, 10)}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

/**
 * Visibility or average position over time: one metric at a time (one axis),
 * switched in the header. Position is drawn with 1 at the top, so up always
 * means better; a table view carries the same figures.
 */
export function VisibilityChart({ series }: { series: VisibilityPoint[] }) {
  const [metric, setMetric] = useState<Metric>('visibility');
  const [asTable, setAsTable] = useState(false);
  const def = METRICS[metric];
  const data = series.map((p) => ({ date: p.date, value: p[metric] }));
  const position = metric === 'avgPosition';

  return (
    <section className="flex flex-col rounded border bg-card shadow-xs" aria-labelledby="rank-trend-title">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5">
        <div className="min-w-0">
          <h2 id="rank-trend-title" className="text-sm font-semibold">
            {def.title} over time
          </h2>
          <p className="text-xs text-muted-foreground">
            {position ? 'Higher on the chart is better (position 1 is the top of Google).' : 'The share of clicks the site could win from its keywords, weighted by position.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Segmented
            label="Metric"
            value={metric}
            onChange={setMetric}
            options={[
              ['visibility', 'Visibility'],
              ['avgPosition', 'Avg position'],
            ]}
          />
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setAsTable((v) => !v)} aria-pressed={asTable}>
            {asTable ? <LineChartIcon className="size-3.5" /> : <Table2 className="size-3.5" />}
            {asTable ? 'Chart' : 'Table'}
          </Button>
        </div>
      </header>

      {series.length < 2 ? (
        <p className="flex flex-1 items-center justify-center px-4 py-16 text-center text-sm text-muted-foreground">The trend appears after the second day of checks.</p>
      ) : asTable ? (
        <div className="max-h-64 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                <TableHead className={TABLE_HEAD}>Date</TableHead>
                <TableHead className={cn(TABLE_HEAD, 'text-right')}>Visibility</TableHead>
                <TableHead className={cn(TABLE_HEAD, 'text-right')}>Avg position</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...series].reverse().map((p) => (
                <TableRow key={p.date}>
                  <TableCell className="px-3 tabular-nums">{formatDate(p.date)}</TableCell>
                  <TableCell className="px-3 text-right tabular-nums">{METRICS.visibility.format(p.visibility)}</TableCell>
                  <TableCell className="px-3 text-right tabular-nums">{formatPosition(p.avgPosition)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div
          className="px-2 pb-2 pt-4"
          role="img"
          aria-label={`${def.title} by day from ${formatDate(series[0].date)} (${def.format(series[0][metric])}) to ${formatDate(series[series.length - 1].date)} (${def.format(series[series.length - 1][metric])}). Use the Table button for the figures.`}
        >
          <ChartContainer config={config} className="aspect-auto h-56 w-full">
            <LineChart data={data} margin={{ top: 4, right: 12, bottom: 0, left: 4 }} accessibilityLayer>
              <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={32} tickFormatter={shortDate} />
              <YAxis
                width={40}
                tickLine={false}
                axisLine={false}
                tickMargin={4}
                reversed={position}
                domain={position ? [1, 'auto'] : [0, 'auto']}
                allowDecimals={false}
                tickFormatter={def.tick}
              />
              <ChartTooltip
                cursor={{ stroke: 'var(--border)', strokeWidth: 1 }}
                content={({ active, payload }) => {
                  const p = active ? (payload?.[0]?.payload as { date: string; value: number | null } | undefined) : undefined;
                  if (!p) return null;
                  return (
                    <div className="grid min-w-40 gap-1 rounded border bg-popover px-2.5 py-2 text-xs text-popover-foreground shadow-md">
                      <span className="text-muted-foreground">{formatDate(p.date)}</span>
                      <span className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-1.5">
                          <span className="size-2 rounded-full bg-chart-current" aria-hidden />
                          {def.title}
                        </span>
                        <span className="font-semibold tabular-nums">{def.format(p.value)}</span>
                      </span>
                    </div>
                  );
                }}
              />
              <Line dataKey="value" type="monotone" stroke="var(--color-value)" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--card)' }} isAnimationActive={false} />
            </LineChart>
          </ChartContainer>
        </div>
      )}
    </section>
  );
}

export function VisibilityChartSkeleton() {
  return (
    <div className="rounded border bg-card" aria-busy="true" aria-label="Loading the trend">
      <div className="flex justify-between border-b px-4 py-3">
        <Skeleton className="h-3.5 w-40 rounded" />
        <Skeleton className="h-7 w-44 rounded" />
      </div>
      <div className="relative h-56">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="absolute inset-x-10 border-t border-muted" style={{ top: `${15 + i * 25}%` }} />
        ))}
      </div>
    </div>
  );
}
