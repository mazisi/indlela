import type { Allowance, Grid, LocalGridUsage } from '../types';
import { isScanActive } from './labels';

export { usageLevel, usagePercent, type UsageLevel } from '@/features/rank-tracking/lib/usage';

export const left = (a: Allowance) => Math.max(0, a.limit - a.used);

export const PAUSED_MESSAGE = 'Local grid scans are paused for now.';

/** Why Scan now can't run, or null when it can. */
export function scanNowBlocked(usage: LocalGridUsage | undefined): string | null {
  if (!usage) return null;
  if (usage.paused) return PAUSED_MESSAGE;
  if (left(usage.scansToday) === 0) return `You've used all ${usage.scansToday.limit} scans for today. They reset at midnight.`;
  return null;
}

/** Why a business search can't run, or null when it can. */
export function searchBlocked(usage: LocalGridUsage | undefined): string | null {
  if (!usage) return null;
  if (usage.paused) return 'Business search is paused for now.';
  if (left(usage.searchesToday) === 0) return `You've used all ${usage.searchesToday.limit} business searches for today. They reset at midnight.`;
  return null;
}

/** No room for another active grid. */
export const gridsFull = (usage: LocalGridUsage | undefined) => Boolean(usage && left(usage.grids) === 0);

/** Why this grid can't be scanned now, or null. */
export function gridScanBlocked(grid: Grid, workspaceReason: string | null): string | null {
  if (isScanActive(grid.latestScan)) return 'A scan is under way.';
  if (!grid.isActive) return 'Resume the grid to scan it.';
  return workspaceReason;
}
