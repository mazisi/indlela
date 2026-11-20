import { useState } from 'react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { LineChart as LineChartIcon, Table2 } from 'lucide-react';
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TABLE_HEAD } from '@/components/table/tableStyles';
import { formatCompact, formatNumber } from '@/features/search-console/lib/format';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/formatDate';
import { fromYmd } from '../../lib/period';
import { ReportCard } from './ReportBlocks';

const config = { clicks: { label: 'Clicks', color: 'var(--brand-accent)' } } satisfies ChartConfig;

const shortDate = (ymd: string) => fromYmd(ymd).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

/**
 * Clicks by day over the period: one series in the agency's colour (no
 * legend; the title names it), a hover tooltip and a table view with the
 * same figures.
 */
export function ClicksChart({ series }: { series: { date: string; clicks: number }[] }) {
  const [asTable, setAsTable] = useState(false);
  const total = series.reduce((n, p) => n + p.clicks, 0);
  return (
    <ReportCard
      title="Clicks by day"
      aside={
        series.length > 0 && (
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs print:hidden" onClick={() => setAsTable((v) => !v)} aria-pressed={asTable}>
            {asTable ? <LineChartIcon className="size-3.5" /> : <Table2 className="size-3.5" />}
            {asTable ? 'Chart' : 'Table'}
          </Button>
        )
      }
    >
      {series.length === 0 ? (
        <p className="px-4 py-12 text-center text-sm text-muted-foreground">No clicks recorded in this period.</p>
      ) : asTable ? (
        <div className="max-h-72 overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                <TableHead className={TABLE_HEAD}>Date</TableHead>
                <TableHead className={cn(TABLE_HEAD, 'text-right')}>Clicks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {series.map((p) => (
                <TableRow key={p.date}>
                  <TableCell className="px-3 tabular-nums">{formatDate(p.date)}</TableCell>
                  <TableCell className="px-3 text-right tabular-nums">{formatNumber(p.clicks)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div
          className="px-2 pb-2 pt-4"
          role="img"
          aria-label={`Clicks by day from ${formatDate(series[0].date)} to ${formatDate(series[series.length - 1].date)}: ${formatNumber(total)} in total. Use the Table button for each day.`}
        >
          <ChartContainer config={config} className="aspect-auto h-56 w-full">
            <LineChart data={series} margin={{ top: 4, right: 12, bottom: 0, left: 4 }} accessibilityLayer>
              <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={32} tickFormatter={shortDate} />
              <YAxis width={44} tickLine={false} axisLine={false} tickMargin={4} allowDecimals={false} domain={[0, 'auto']} tickFormatter={(n: number) => formatCompact(n)} />
              <ChartTooltip
                cursor={{ stroke: 'var(--border)', strokeWidth: 1 }}
                content={({ active, payload }) => {
                  const p = active ? (payload?.[0]?.payload as { date: string; clicks: number } | undefined) : undefined;
                  if (!p) return null;
                  return (
                    <div className="flex min-w-36 items-center justify-between gap-4 rounded border bg-popover px-2.5 py-2 text-xs text-popover-foreground shadow-md">
                      <span className="text-muted-foreground">{formatDate(p.date)}</span>
                      <span className="font-semibold tabular-nums">{formatNumber(p.clicks)} clicks</span>
                    </div>
                  );
                }}
              />
              <Line dataKey="clicks" type="monotone" stroke="var(--color-clicks)" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--card)' }} isAnimationActive={false} />
            </LineChart>
          </ChartContainer>
        </div>
      )}
    </ReportCard>
  );
}
