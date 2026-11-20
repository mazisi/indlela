import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { SheetCloseFooter } from '@/components/form/SheetCloseFooter';
import { cn } from '@/lib/utils';
import { formatLatLng } from '../../lib/geometry';
import { MAX_RANK, rankText } from '../../lib/rank';
import type { ScanPoint } from '../../types';
import { RankDot, Rating } from '../cells';

interface Props {
  point: ScanPoint | undefined;
  businessTitle: string;
  onClose: () => void;
}

function Verdict({ point, businessTitle }: { point: ScanPoint; businessTitle: string }) {
  if (point.status === 'pending') return <p className="text-sm text-muted-foreground">This point hasn't been checked yet.</p>;
  if (point.status === 'failed') return <p className="text-sm text-muted-foreground">The check at this point failed; the next scan tries again.</p>;
  return (
    <div className="flex items-center gap-3 rounded border bg-card p-3">
      <RankDot rank={point.rank} className="size-9 text-sm" />
      <p className="text-sm">
        <span className="font-semibold">{businessTitle}</span>{' '}
        {point.rank && point.rank <= MAX_RANK ? (
          <>
            is <span className="font-semibold">#{point.rank}</span> in the map results here.
          </>
        ) : (
          <>isn't in the top {MAX_RANK} here.</>
        )}
      </p>
    </div>
  );
}

/** One point of the grid: where the business ranks there and the map pack's top 3, the business highlighted. */
export function PointSheet({ point, businessTitle, onClose }: Props) {
  return (
    <Sheet open={Boolean(point)} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Grid point</p>
          <SheetTitle className="text-lg">{point ? `Row ${point.row + 1}, column ${point.col + 1}` : 'Grid point'}</SheetTitle>
          <SheetDescription>{point ? `${formatLatLng(point)} · ${rankText(point.rank, point.status)}` : ''}</SheetDescription>
        </SheetHeader>
        {point && (
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            <Verdict point={point} businessTitle={businessTitle} />
            <section aria-labelledby="point-top3-title" className="space-y-2">
              <h3 id="point-top3-title" className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                Map pack top 3 here
              </h3>
              {point.top.length === 0 ? (
                <p className="rounded border border-dashed px-3 py-3 text-center text-sm text-muted-foreground">No results recorded at this point.</p>
              ) : (
                <ol className="space-y-1.5">
                  {[...point.top]
                    .sort((a, b) => a.rank - b.rank)
                    .map((r) => (
                      <li
                        key={`${r.rank}-${r.title}`}
                        data-target={r.isTarget || undefined}
                        className={cn('flex items-start gap-3 rounded border p-2.5', r.isTarget ? 'border-primary/40 bg-accent/60' : 'bg-card')}
                      >
                        <span className="grid size-6 shrink-0 place-items-center rounded bg-muted text-xs font-bold tabular-nums">{r.rank}</span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium">{r.title}</span>
                            {r.isTarget && <span className="shrink-0 rounded bg-primary px-1.5 py-px text-2xs font-semibold text-primary-foreground">Your business</span>}
                          </span>
                          <span className="mt-0.5 flex flex-wrap items-center gap-x-2">
                            <Rating rating={r.rating} votes={r.votes} />
                            {r.domain && <span className="truncate text-xs text-muted-foreground">{r.domain}</span>}
                          </span>
                        </span>
                      </li>
                    ))}
                </ol>
              )}
            </section>
          </div>
        )}
        <SheetCloseFooter />
      </SheetContent>
    </Sheet>
  );
}
