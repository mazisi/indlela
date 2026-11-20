import { formatDate } from '@/utils/formatDate';
import type { GscSite } from '../types';

export type SyncTone = 'ok' | 'busy' | 'bad' | 'idle';

export interface SyncView {
  tone: SyncTone;
  label: string;
  /** Longer text for the tooltip / title. */
  detail?: string;
}

/** "just now", "5 min ago", "2 h ago", "3 days ago". */
export function timeAgo(iso: string, now = new Date()): string {
  const seconds = Math.max(0, (now.getTime() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? 'day' : 'days'} ago`;
}

export const isSyncing = (site: Pick<GscSite, 'gscSyncStatus'>) => site.gscSyncStatus === 'queued' || site.gscSyncStatus === 'syncing';

/** The header's sync badge for a linked site. */
export function describeSync(site: GscSite, now = new Date()): SyncView {
  if (isSyncing(site)) return { tone: 'busy', label: site.gscSyncStatus === 'queued' ? 'Sync queued…' : 'Syncing…' };
  if (site.gscSyncStatus === 'failed') {
    return { tone: 'bad', label: `Failed: ${site.gscSyncError ?? 'the last sync did not finish'}`, detail: site.gscSyncError ?? undefined };
  }
  if (!site.gscSyncedAt) return { tone: 'idle', label: 'Not synced yet' };
  const through = site.gscDataThrough ? ` · data through ${formatDate(site.gscDataThrough)}` : '';
  return { tone: 'ok', label: `Synced ${timeAgo(site.gscSyncedAt, now)}${through}` };
}
