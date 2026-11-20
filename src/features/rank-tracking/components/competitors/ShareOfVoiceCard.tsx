import { useId, useState } from 'react';
import { BarChart3, Table2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TABLE_HEAD } from '@/components/table/tableStyles';
import { formatNumber, formatPosition } from '@/features/search-console/lib/format';
import { cn } from '@/lib/utils';
import { formatShare, type SovSeries } from '../../lib/competitors';

/** Below this share a segment is too narrow for its label; the legend and table carry it. */
const LABEL_MIN_SHARE = 9;

/** Ink inside a fill: white, near-black on the yellow slot (as the palette specifies). */
const inkOn = (color: string) => (color === 'var(--series-4)' ? 'text-[#0b0b0b]' : 'text-white');

export function SeriesSwatch({ color, className }: { color: string; className?: string }) {
  return <span className={cn('size-2.5 shrink-0 rounded-sm', className)} style={{ background: color }} aria-hidden />;
}

/**
 * Share of voice: one whole (every top-10 position the site and its active
 * competitors hold) split into each domain's share, the site first and
 * emphasised, competitors in the order they were added. Shares are printed
 * inside the wide segments; the legend carries each figure, a hover shows the
 * counts, and a table view has them all.
 */
export function ShareOfVoiceCard({ series, keywordsTotal }: { series: SovSeries[]; keywordsTotal: number }) {
  const titleId = useId();
  const [asTable, setAsTable] = useState(false);
  const [hover, setHover] = useState<string>();
  const total = series.reduce((n, s) => n + s.stats.top10, 0);
  const shown = series.filter((s) => s.stats.top10 > 0);
  const hovered = shown.find((s) => s.key === hover);
  // The tooltip sits over the middle of the hovered segment.
  let offset = 0;
  const centres = new Map<string, number>();
  shown.forEach((s) => {
    const width = (s.stats.top10 / total) * 100;
    centres.set(s.key, offset + width / 2);
    offset += width;
  });

  return (
    <section className="flex flex-col rounded border bg-card shadow-xs" aria-labelledby={titleId}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5">
        <div className="min-w-0">
          <h2 id={titleId} className="text-sm font-semibold">
            Share of voice
          </h2>
          <p className="text-xs text-muted-foreground">Who holds the top-10 positions on your {formatNumber(keywordsTotal)} tracked keywords, on the latest checks.</p>
        </div>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setAsTable((v) => !v)} aria-pressed={asTable}>
          {asTable ? <BarChart3 className="size-3.5" /> : <Table2 className="size-3.5" />}
          {asTable ? 'Chart' : 'Table'}
        </Button>
      </header>

      {asTable ? (
        <SovTable series={series} />
      ) : (
        <div className="space-y-4 p-4">
          {total === 0 ? (
            <p className="rounded border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">Nobody holds a top-10 position on the latest checks yet.</p>
          ) : (
            <div className="relative" onMouseLeave={() => setHover(undefined)}>
              <div className="flex h-7 w-full gap-0.5" data-testid="sov-bar" aria-hidden>
                {shown.map((s) => {
                  const share = (s.stats.top10 / total) * 100;
                  return (
                    <span
                      key={s.key}
                      data-series={s.key}
                      onMouseEnter={() => setHover(s.key)}
                      className={cn('flex h-full min-w-1 items-center overflow-hidden rounded px-2 transition-opacity', hover && hover !== s.key && 'opacity-50')}
                      style={{ width: `${share}%`, background: s.color }}
                    >
                      {share >= LABEL_MIN_SHARE && <span className={cn('truncate text-xs font-semibold tabular-nums', inkOn(s.color))}>{formatShare(s.stats.sov)}</span>}
                    </span>
                  );
                })}
              </div>
              {hovered && (
                <div
                  role="tooltip"
                  className="pointer-events-none absolute bottom-full z-10 mb-2 grid min-w-44 -translate-x-1/2 gap-1 rounded border bg-popover px-2.5 py-2 text-xs text-popover-foreground shadow-md"
                  style={{ left: `${Math.min(85, Math.max(15, centres.get(hovered.key) ?? 50))}%` }}
                >
                  <span className="flex items-center gap-1.5 font-medium">
                    <SeriesSwatch color={hovered.color} />
                    {hovered.isSite ? `You · ${hovered.domain}` : hovered.name}
                  </span>
                  <Figure label="Share of voice" value={formatShare(hovered.stats.sov)} />
                  <Figure label="In the top 10" value={`${formatNumber(hovered.stats.top10)} keywords`} />
                  <Figure label="In the top 3" value={formatNumber(hovered.stats.top3)} />
                </div>
              )}
            </div>
          )}

          <ul className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2" aria-label="Share of voice by domain">
            {series.map((s) => (
              <li key={s.key} className="flex items-center justify-between gap-3 text-xs" onMouseEnter={() => setHover(s.key)} onMouseLeave={() => setHover(undefined)}>
                <span className="flex min-w-0 items-center gap-1.5">
                  <SeriesSwatch color={s.color} />
                  <span className={cn('truncate', s.isSite ? 'font-semibold text-foreground' : 'text-muted-foreground')} title={s.domain}>
                    {s.isSite ? `You · ${s.domain}` : s.name}
                  </span>
                </span>
                <span className="flex shrink-0 items-baseline gap-2 tabular-nums">
                  <span className="text-muted-foreground">{formatNumber(s.stats.top10)} in top 10</span>
                  <span className={cn('w-10 text-right font-semibold', s.isSite && 'text-primary')}>{formatShare(s.stats.sov)}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

const Figure = ({ label, value }: { label: string; value: string }) => (
  <span className="flex items-center justify-between gap-3">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-semibold tabular-nums">{value}</span>
  </span>
);

function SovTable({ series }: { series: SovSeries[] }) {
  const right = cn(TABLE_HEAD, 'text-right');
  return (
    <div className="overflow-x-auto">
      <Table aria-label="Share of voice">
        <TableHeader>
          <TableRow>
            <TableHead className={TABLE_HEAD}>Domain</TableHead>
            <TableHead className={right}>Top 3</TableHead>
            <TableHead className={right}>Top 10</TableHead>
            <TableHead className={right}>Ranked</TableHead>
            <TableHead className={right}>Avg position</TableHead>
            <TableHead className={right}>Share of voice</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {series.map((s) => (
            <TableRow key={s.key}>
              <TableCell className="px-3">
                <span className="flex items-center gap-1.5">
                  <SeriesSwatch color={s.color} />
                  <span className={cn('truncate', s.isSite && 'font-semibold')}>{s.isSite ? `You · ${s.domain}` : s.name}</span>
                </span>
              </TableCell>
              <TableCell className="px-3 text-right tabular-nums">{formatNumber(s.stats.top3)}</TableCell>
              <TableCell className="px-3 text-right tabular-nums">{formatNumber(s.stats.top10)}</TableCell>
              <TableCell className="px-3 text-right tabular-nums">{formatNumber(s.stats.ranked)}</TableCell>
              <TableCell className="px-3 text-right tabular-nums">{formatPosition(s.stats.avgPosition)}</TableCell>
              <TableCell className="px-3 text-right font-semibold tabular-nums">{formatShare(s.stats.sov)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
