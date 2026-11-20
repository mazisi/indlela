import { Loader2 } from 'lucide-react';
import { formatNumber } from '@/features/search-console/lib/format';
import { scanProgress } from '../../lib/labels';
import type { Scan } from '../../types';

/** A scan under way: points done of the total, updating as the page polls. */
export function ScanProgress({ scan }: { scan: Scan }) {
  const percent = scanProgress(scan);
  return (
    <section className="flex items-start gap-3 rounded border border-primary/20 bg-accent/50 p-4" aria-label="Scan progress">
      <Loader2 className="mt-0.5 size-5 shrink-0 animate-spin text-primary" aria-hidden />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
          <p className="font-semibold">{scan.status === 'queued' ? 'Scan queued: starting shortly' : 'Scanning the grid'}</p>
          <p className="tabular-nums text-muted-foreground" data-testid="scan-progress">
            {formatNumber(scan.pointsDone)} of {formatNumber(scan.pointsTotal)} points
          </p>
        </div>
        <div
          role="progressbar"
          aria-label="Points checked"
          aria-valuemin={0}
          aria-valuemax={scan.pointsTotal}
          aria-valuenow={scan.pointsDone}
          className="h-1.5 overflow-hidden rounded-full bg-primary/15"
        >
          <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${percent}%` }} />
        </div>
        <p className="text-xs text-muted-foreground">Points fill in on the heatmap as they're checked. This page updates by itself.</p>
      </div>
    </section>
  );
}
