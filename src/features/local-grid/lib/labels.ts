import type { GridDevice, GridSchedule, GridSize, Scan, ScanStatus, SpacingKm } from '../types';

export const GRID_SIZES: readonly GridSize[] = [3, 5, 7];
export const SPACINGS: readonly SpacingKm[] = [0.5, 1, 2, 3, 5];

export const DEFAULT_SIZE: GridSize = 5;
export const DEFAULT_SPACING: SpacingKm = 1;

export const sizeLabel = (size: number) => `${size}×${size}`;

const km = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 1 });
export const formatKm = (n: number) => `${km.format(n)} km`;

/** "5×5 · 1 km". */
export const gridShape = (size: number, spacingKm: number) => `${sizeLabel(size)} · ${formatKm(spacingKm)}`;

export const DEVICE_LABEL: Record<GridDevice, string> = { mobile: 'Mobile', desktop: 'Desktop' };

export const SCHEDULE_LABEL: Record<GridSchedule, string> = { none: 'Manual only', weekly: 'Weekly', monthly: 'Monthly' };

export const SCHEDULE_HINT: Record<GridSchedule, string> = {
  none: 'Scan only when you press Scan now.',
  weekly: 'A fresh scan every 7 days.',
  monthly: 'A fresh scan on the same day each month.',
};

export const SCAN_STATUS_LABEL: Record<ScanStatus, string> = { queued: 'Queued', running: 'Scanning', done: 'Done', failed: 'Failed' };

/** Queued or running: the page polls it. */
export const isScanActive = (scan: Pick<Scan, 'status'> | null | undefined) => scan?.status === 'queued' || scan?.status === 'running';

/** 0–100 for the progress bar. */
export const scanProgress = (scan: Pick<Scan, 'pointsDone' | 'pointsTotal'>) =>
  scan.pointsTotal > 0 ? Math.min(100, Math.round((scan.pointsDone / scan.pointsTotal) * 100)) : 0;

const oneDecimal = new Intl.NumberFormat('en-GB', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** An average rank to one decimal; "—" when there is none. */
export const formatAvgRank = (n: number | null | undefined) => (typeof n === 'number' && Number.isFinite(n) ? oneDecimal.format(n) : '—');

/** A 0–100 share as a whole percentage. */
export const formatShare = (n: number | null | undefined) => (typeof n === 'number' && Number.isFinite(n) ? `${Math.round(n)}%` : '—');

/** When a scan ran (or was asked for). */
export const scanDate = (scan: Pick<Scan, 'finishedAt' | 'startedAt' | 'createdAt'>) => scan.finishedAt ?? scan.startedAt ?? scan.createdAt;
