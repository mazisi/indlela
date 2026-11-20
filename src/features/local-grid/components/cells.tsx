import { CalendarClock, Loader2, Monitor, PauseCircle, Smartphone, Star } from 'lucide-react';
import { formatNumber } from '@/features/search-console/lib/format';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/formatDate';
import { DEVICE_LABEL, SCAN_STATUS_LABEL, SCHEDULE_LABEL, scanProgress } from '../lib/labels';
import { RANK_TONES, rankLabel, rankTone } from '../lib/rank';
import type { Grid, GridDevice, PointStatus, Scan, ScanStatus } from '../types';

export const Muted = ({ children }: { children: string }) => <span className="text-xs text-muted-foreground">{children}</span>;

export function DeviceTag({ device }: { device: GridDevice }) {
  const Icon = device === 'mobile' ? Smartphone : Monitor;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Icon className="size-3.5" aria-hidden />
      {DEVICE_LABEL[device]}
    </span>
  );
}

const STATUS_STYLE: Record<ScanStatus, string> = {
  queued: 'border-primary/25 bg-accent text-primary',
  running: 'border-primary/25 bg-accent text-primary',
  done: 'border-ok/25 bg-ok-soft text-ok',
  failed: 'border-bad/25 bg-bad-soft text-bad',
};

/** A scan's status pill; under way, with its progress. */
export function ScanStatusBadge({ scan }: { scan: Pick<Scan, 'status' | 'pointsDone' | 'pointsTotal'> }) {
  const active = scan.status === 'queued' || scan.status === 'running';
  return (
    <span className={cn('inline-flex items-center gap-1 rounded border px-1.5 py-px text-2xs font-semibold', STATUS_STYLE[scan.status])} data-status={scan.status}>
      {active && <Loader2 className="size-3 animate-spin" aria-hidden />}
      {SCAN_STATUS_LABEL[scan.status]}
      {scan.status === 'running' && <span className="tabular-nums">{scanProgress(scan)}%</span>}
    </span>
  );
}

/** The grid's schedule, its next scan, or Paused. */
export function ScheduleCell({ grid }: { grid: Pick<Grid, 'schedule' | 'isActive' | 'nextScanOn'> }) {
  if (!grid.isActive) {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-px text-2xs font-semibold text-muted-foreground">
        <PauseCircle className="size-3" aria-hidden />
        Paused
      </span>
    );
  }
  if (grid.schedule === 'none') return <Muted>{SCHEDULE_LABEL.none}</Muted>;
  return (
    <span className="block">
      <span className="inline-flex items-center gap-1 text-sm">
        <CalendarClock className="size-3.5 text-muted-foreground" aria-hidden />
        {SCHEDULE_LABEL[grid.schedule]}
      </span>
      {grid.nextScanOn && <span className="block text-2xs text-muted-foreground">Next {formatDate(grid.nextScanOn)}</span>}
    </span>
  );
}

/** A round rank marker, as on the map (legend, top results). */
export function RankDot({ rank, status = 'done', className }: { rank: number | null; status?: PointStatus; className?: string }) {
  const tone = RANK_TONES[rankTone(rank, status)];
  return (
    <span
      aria-hidden
      className={cn('inline-grid size-6 shrink-0 place-items-center rounded-full text-2xs font-bold tabular-nums ring-1 ring-black/10', className)}
      style={{ background: tone.fill, color: tone.ink }}
    >
      {rankLabel(rank, status)}
    </span>
  );
}

/** A listing's Google rating: ★ 4.6 (128). */
export function Rating({ rating, votes }: { rating: number | null; votes: number | null }) {
  if (rating === null) return null;
  return (
    <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
      <Star className="size-3 fill-current text-warn" aria-hidden />
      <span className="tabular-nums">{rating.toFixed(1)}</span>
      {votes !== null && <span className="tabular-nums">({formatNumber(votes)})</span>}
      <span className="sr-only"> stars</span>
    </span>
  );
}
