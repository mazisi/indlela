import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts';
import { BarChart3, Table2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TABLE_HEAD } from '@/components/table/tableStyles';
import { formatNumber } from '@/features/search-console/lib/format';
import { cn } from '@/lib/utils';
import { formatUsd, formatUsdShort, monthLabel, shortMonth } from '../lib/format';
import type { MonthUsage, YearMonth } from '../types';

const config = { cost: { label: 'Cost', color: 'var(--chart-current)' } } satisfies ChartConfig;

/**
 * DataForSEO cost per month for the last six months, one axis (dollars); the
 * current month is drawn solid, past months in a lighter tint of the same
 * hue. Hover shows cost and checks; a table view carries the same figures.
 */
export function CostByMonthChart({ series, current }: { series: MonthUsage[]; current: YearMonth }) {
  const [asTable, setAsTable] = useState(false);
  const total = series.reduce((n, p) => n + p.cost, 0);
  const first = series[0];
  const last = series[series.length - 1];

  return (
    <section className="flex flex-col rounded border bg-card shadow-xs" aria-labelledby="platform-cost-title">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5">
        <div className="min-w-0">
          <h2 id="platform-cost-title" className="text-sm font-semibold">
            Cost by month
          </h2>
          <p className="text-xs text-muted-foreground">DataForSEO charges across every workspace: {formatUsd(total)} over {series.length} months.</p>
        </div>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setAsTable((v) => !v)} aria-pressed={asTable}>
          {asTable ? <BarChart3 className="size-3.5" /> : <Table2 className="size-3.5" />}
          {asTable ? 'Chart' : 'Table'}
        </Button>
      </header>

      {series.length === 0 ? (
        <p className="flex flex-1 items-center justify-center px-4 py-16 text-center text-sm text-muted-foreground">No checks have been charged yet.</p>
      ) : asTable ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className={TABLE_HEAD}>Month</TableHead>
              <TableHead className={cn(TABLE_HEAD, 'text-right')}>Cost</TableHead>
              <TableHead className={cn(TABLE_HEAD, 'text-right')}>Checks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...series].reverse().map((p) => (
              <TableRow key={p.month} className={cn(p.month === current && 'font-semibold')}>
                <TableCell className="px-3">
                  {monthLabel(p.month)}
                  {p.month === current && <span className="ml-2 text-2xs font-medium uppercase tracking-wide text-muted-foreground">So far</span>}
                </TableCell>
                <TableCell className="px-3 text-right tabular-nums">{formatUsd(p.cost)}</TableCell>
                <TableCell className="px-3 text-right tabular-nums">{formatNumber(p.checks)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div
          className="px-2 pb-2 pt-4"
          role="img"
          aria-label={`Cost by month from ${monthLabel(first.month)} (${formatUsd(first.cost)}) to ${monthLabel(last.month)} (${formatUsd(last.cost)} so far). Use the Table button for the figures.`}
        >
          <ChartContainer config={config} className="aspect-auto h-56 w-full">
            <BarChart data={series} margin={{ top: 4, right: 12, bottom: 0, left: 4 }} barCategoryGap="28%" accessibilityLayer>
              <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={shortMonth} />
              <YAxis width={48} tickLine={false} axisLine={false} tickMargin={4} tickFormatter={formatUsdShort} allowDecimals />
              <ChartTooltip
                cursor={{ fill: 'var(--muted)', opacity: 0.5 }}
                content={({ active, payload }) => {
                  const p = active ? (payload?.[0]?.payload as MonthUsage | undefined) : undefined;
                  if (!p) return null;
                  return (
                    <div className="grid min-w-44 gap-1 rounded border bg-popover px-2.5 py-2 text-xs text-popover-foreground shadow-md">
                      <span className="text-muted-foreground">
                        {monthLabel(p.month)}
                        {p.month === current ? ' (so far)' : ''}
                      </span>
                      <span className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-1.5">
                          <span className="size-2 rounded-full bg-chart-current" aria-hidden />
                          Cost
                        </span>
                        <span className="font-semibold tabular-nums">{formatUsd(p.cost)}</span>
                      </span>
                      <span className="flex items-center justify-between gap-3">
                        <span className="pl-3.5">Checks</span>
                        <span className="font-semibold tabular-nums">{formatNumber(p.checks)}</span>
                      </span>
                    </div>
                  );
                }}
              />
              <Bar dataKey="cost" radius={[4, 4, 0, 0]} maxBarSize={56} isAnimationActive={false}>
                {series.map((p) => (
                  <Cell key={p.month} fill="var(--color-cost)" fillOpacity={p.month === current ? 1 : 0.4} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>
      )}
    </section>
  );
}

/** Header, gridlines and six bar-shaped blocks along the baseline. */
export function CostByMonthChartSkeleton() {
  return (
    <div className="rounded border bg-card" aria-busy="true" aria-label="Loading the cost by month">
      <div className="flex justify-between border-b px-4 py-3">
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-28 rounded" />
          <Skeleton className="h-3 w-64 rounded" />
        </div>
        <Skeleton className="h-7 w-16 rounded" />
      </div>
      <div className="flex h-56 items-end justify-around gap-6 px-14 pb-8 pt-4">
        {['h-1/3', 'h-1/2', 'h-2/5', 'h-3/5', 'h-4/5', 'h-1/2'].map((h, i) => (
          <Skeleton key={i} className={cn('w-10 rounded-t-[4px] rounded-b-none', h)} />
        ))}
      </div>
    </div>
  );
}
