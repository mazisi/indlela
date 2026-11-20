import { formatNumber } from '@/features/search-console/lib/format';
import type { Audit, AuditStatus } from '../types';

const RUNNING: readonly AuditStatus[] = ['queued', 'crawling', 'analysing'];

export const isRunning = (audit: Pick<Audit, 'status'> | null | undefined): boolean => Boolean(audit && RUNNING.includes(audit.status));

/** The pages the crawl will reach: what it has found so far, capped at the page limit (the limit until it has found any). */
export function crawlTarget(audit: Pick<Audit, 'pagesFound' | 'pageLimit' | 'pagesCrawled'>): number {
  const found = audit.pagesFound > 0 ? Math.min(audit.pagesFound, audit.pageLimit) : audit.pageLimit;
  return Math.max(found, audit.pagesCrawled);
}

/** 0–100 for a determinate progress bar while crawling; null while queued or analysing (indeterminate). */
export function crawlPercent(audit: Audit): number | null {
  if (audit.status !== 'crawling') return null;
  const target = crawlTarget(audit);
  return target > 0 ? Math.min(100, Math.round((audit.pagesCrawled / target) * 100)) : 0;
}

/** "Waiting in the queue…", "Crawling… 143 / 500 pages", "Analysing 143 pages…". */
export function progressLabel(audit: Audit): string {
  switch (audit.status) {
    case 'queued':
      return 'Waiting in the queue…';
    case 'crawling':
      return `Crawling… ${formatNumber(audit.pagesCrawled)} / ${formatNumber(crawlTarget(audit))} pages`;
    case 'analysing':
      return `Analysing ${formatNumber(audit.pagesCrawled)} pages…`;
    default:
      return '';
  }
}

/** The toast when a running audit stops: what happened, in a sentence. */
export function finishedMessage(audit: Audit, siteName: string): { type: 'success' | 'error' | 'default'; text: string } {
  if (audit.status === 'failed') return { type: 'error', text: `The audit of ${siteName} failed${audit.error ? `: ${audit.error}` : '.'}` };
  if (audit.status === 'cancelled') return { type: 'default', text: `The audit of ${siteName} was cancelled.` };
  const changes = audit.comparison ? ` ${comparisonSentence(audit.comparison.fixed, audit.comparison.new)}.` : '';
  const score = audit.healthScore !== null ? ` Health score ${audit.healthScore}.` : '';
  return { type: 'success', text: `Audit of ${siteName} finished.${score}${changes}` };
}

const plural = (n: number, one: string, many = `${one}s`) => `${formatNumber(n)} ${n === 1 ? one : many}`;

/** "12 issues fixed, 3 new" · "No change" · "1 issue fixed, none new". */
export function comparisonSentence(fixed: number, added: number): string {
  if (fixed === 0 && added === 0) return 'No issues fixed or new';
  if (added === 0) return `${plural(fixed, 'issue')} fixed, none new`;
  if (fixed === 0) return `No issues fixed, ${formatNumber(added)} new`;
  return `${plural(fixed, 'issue')} fixed, ${formatNumber(added)} new`;
}

export const SCHEDULE_LABELS = { off: 'Manual only', weekly: 'Weekly', monthly: 'Monthly' } as const;

/** "Weekly · 500 pages". */
export const scheduleLabel = (schedule: keyof typeof SCHEDULE_LABELS, pageLimit: number) => `${SCHEDULE_LABELS[schedule]} · ${formatNumber(pageLimit)} pages`;
