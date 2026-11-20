import type { Audit, AuditSite } from '../types';

/**
 * What a site's audit page shows, in order of precedence: the site isn't
 * there (or not the user's) → not found; an audit chosen in the URL → that
 * audit; the latest done audit → it (with a notice when a newer audit failed
 * or was cancelled); no done audit yet → the running first audit, the failed
 * one, or "Run your first audit".
 *
 * The sites list's `latestAudit` is the latest *done* audit; a newer failed
 * or cancelled one is only seen in the history (`recent`, newest first).
 */
export type DetailState =
  | { kind: 'not_found' }
  | { kind: 'loading' }
  | { kind: 'never_audited' }
  | { kind: 'first_running'; audit: Audit }
  | { kind: 'failed'; audit: Audit }
  /** `failedLatest`: a newer audit that didn't finish, shown as a notice above the done one. */
  | { kind: 'ready'; auditId: number; failedLatest: Audit | null };

const stopped = (a: Audit | undefined) => (a && (a.status === 'failed' || a.status === 'cancelled') ? a : null);

export function decideDetailState(
  site: AuditSite | undefined,
  running: Audit | undefined,
  urlAuditId: number | undefined,
  /** The site's recent audits, newest first; undefined while they load. */
  recent: Audit[] | undefined,
): DetailState {
  if (!site) return { kind: 'not_found' };
  const failedLatest = stopped(recent?.[0]);
  if (urlAuditId) return { kind: 'ready', auditId: urlAuditId, failedLatest: failedLatest && failedLatest.id !== urlAuditId ? failedLatest : null };
  if (site.latestAudit) return { kind: 'ready', auditId: site.latestAudit.id, failedLatest };
  if (running) return { kind: 'first_running', audit: running };
  if (!recent) return { kind: 'loading' };
  return failedLatest ? { kind: 'failed', audit: failedLatest } : { kind: 'never_audited' };
}
