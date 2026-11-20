import { useId, useState } from 'react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { LineChart as LineChartIcon, Table2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TABLE_HEAD } from '@/components/table/tableStyles';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/formatDate';
import { formatShare, weekLabel, type SovSeries } from '../../lib/competitors';
import type { SovWeek } from '../../types';
import { SeriesSwatch } from './ShareOfVoiceCard';

type Row = { weekStart: string } & Record<string, number | null | string>;

const toRows = (trend: SovWeek[], series: SovSeries[]): Row[] =>
  trend.map((w) => {
    const row: Row = { weekStart: w.weekStart };
    series.forEach((s) => {
      row[s.key] = s.isSite ? w.site : (w.competitors[String(s.competitorId)] ?? null);
    });
    return row;
  });

/** The site's line is named at its end; competitors are named in the legend (at most five more lines). */
function EndLabel({ x, y, index, last }: { x?: number | string; y?: number | string; index?: number; last: number }) {
  if (index !== last || x === undefined || y === undefined) return null;
  return (
    <text x={Number(x) + 6} y={Number(y)} dy={4} className="fill-foreground text-xs font-semibold">
      You
    </text>
  );
}

/**
 * Share of voice per ISO week over the last 12 weeks: one line per domain
 * (the site emphasised and labelled at its end, competitors in their fixed
 * colours), one percentage axis, a hover tooltip with every domain's share
 * that week, and a table view.
 */
export function SovTrendChart({ trend, series }: { trend: SovWeek[]; series: SovSeries[] }) {
  const titleId = useId();
  const [asTable, setAsTable] = useState(false);
  const rows = toRows(trend, series);
  const config = Object.fromEntries(series.map((s) => [s.key, { label: s.isSite ? 'You' : s.name, color: s.color }])) satisfies ChartConfig;
  const last = rows.length - 1;
  const site = series.find((s) => s.isSite);

  return (
    <section className="flex flex-col rounded border bg-card shadow-xs" aria-labelledby={titleId}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5">
        <div className="min-w-0">
          <h2 id={titleId} className="text-sm font-semibold">
            Share of voice by week
          </h2>
          <p className="text-xs text-muted-foreground">The last 12 weeks, from each keyword's latest check in the week.</p>
        </div>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setAsTable((v) => !v)} aria-pressed={asTable}>
          {asTable ? <LineChartIcon className="size-3.5" /> : <Table2 className="size-3.5" />}
          {asTable ? 'Chart' : 'Table'}
        </Button>
      </header>

      {rows.length < 2 ? (
        <p className="flex flex-1 items-center justify-center px-4 py-16 text-center text-sm text-muted-foreground">The trend appears after the second week of checks.</p>
      ) : asTable ? (
        <div className="max-h-72 overflow-auto">
          <Table aria-label="Share of voice by week">
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                <TableHead className={TABLE_HEAD}>Week of</TableHead>
                {series.map((s) => (
                  <TableHead key={s.key} className={cn(TABLE_HEAD, 'text-right')}>
                    {s.isSite ? 'You' : s.name}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...rows].reverse().map((r) => (
                <TableRow key={r.weekStart}>
                  <TableCell className="px-3 tabular-nums">{formatDate(r.weekStart)}</TableCell>
                  {series.map((s) => (
                    <TableCell key={s.key} className={cn('px-3 text-right tabular-nums', s.isSite && 'font-semibold')}>
                      {formatShare(r[s.key] as number | null)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="space-y-2 px-4 pb-3 pt-3">
          <ul className="flex flex-wrap gap-x-4 gap-y-1" aria-label="Lines">
            {series.map((s) => (
              <li key={s.key} className="flex min-w-0 items-center gap-1.5 text-xs">
                <SeriesSwatch color={s.color} />
                <span className={cn('max-w-40 truncate', s.isSite ? 'font-semibold text-foreground' : 'text-muted-foreground')}>{s.isSite ? 'You' : s.name}</span>
              </li>
            ))}
          </ul>
          <div
            role="img"
            aria-label={`Share of voice by week from ${formatDate(rows[0].weekStart)} to ${formatDate(rows[last].weekStart)}; yours went from ${formatShare(site ? (rows[0][site.key] as number) : null)} to ${formatShare(site ? (rows[last][site.key] as number) : null)}. Use the Table button for every figure.`}
          >
            <ChartContainer config={config} className="aspect-auto h-56 w-full">
              <LineChart data={rows} margin={{ top: 8, right: 36, bottom: 0, left: 4 }} accessibilityLayer>
                <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
                <XAxis dataKey="weekStart" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} tickFormatter={weekLabel} />
                <YAxis width={40} tickLine={false} axisLine={false} tickMargin={4} domain={[0, 'auto']} allowDecimals={false} tickFormatter={(n: number) => `${n}%`} />
                <ChartTooltip
                  cursor={{ stroke: 'var(--border)', strokeWidth: 1 }}
                  content={({ active, payload }) => {
                    const row = active ? (payload?.[0]?.payload as Row | undefined) : undefined;
                    if (!row) return null;
                    const ranked = [...series].sort((a, b) => ((row[b.key] as number | null) ?? -1) - ((row[a.key] as number | null) ?? -1));
                    return (
                      <div className="grid min-w-48 gap-1 rounded border bg-popover px-2.5 py-2 text-xs text-popover-foreground shadow-md">
                        <span className="text-muted-foreground">Week of {formatDate(row.weekStart)}</span>
                        {ranked.map((s) => (
                          <span key={s.key} className="flex items-center justify-between gap-3">
                            <span className={cn('flex min-w-0 items-center gap-1.5', s.isSite && 'font-semibold')}>
                              <SeriesSwatch color={s.color} />
                              <span className="max-w-36 truncate">{s.isSite ? 'You' : s.name}</span>
                            </span>
                            <span className="font-semibold tabular-nums">{formatShare(row[s.key] as number | null)}</span>
                          </span>
                        ))}
                      </div>
                    );
                  }}
                />
                {/* Competitors first, so the site's line is drawn on top. */}
                {[...series].reverse().map((s) => (
                  <Line
                    key={s.key}
                    dataKey={s.key}
                    type="monotone"
                    stroke={s.color}
                    strokeWidth={s.isSite ? 2.5 : 2}
                    dot={false}
                    connectNulls={false}
                    activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--card)' }}
                    isAnimationActive={false}
                    label={s.isSite ? (props: { x?: number | string; y?: number | string; index?: number }) => <EndLabel {...props} last={last} /> : undefined}
                  />
                ))}
              </LineChart>
            </ChartContainer>
          </div>
        </div>
      )}
    </section>
  );
}
