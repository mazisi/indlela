import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import showToaster from '@/utils/showToaster';
import { getApiErrorMessage } from '@/utils/formErrorHandler';
import { finishedMessage, isRunning } from '../lib/auditStatus';
import type { Audit, AuditSite } from '../types';
import { auditKeys, useAudit, useCancelAudit, useRefreshAfterRun, useStartAudit } from './useSiteAudit';

/**
 * Follows a site's running audit: polls it every 3 s (useAudit) and, when it
 * stops (done, failed or cancelled), says so in a toast and reloads the sites
 * list and the site's history, which brings in the new latest audit. The
 * audit stays followed after the sites list drops it, so the end of the run
 * is never missed. Returns the freshest copy of the running audit, or
 * undefined when none runs.
 */
export function useAuditRun(site: AuditSite | undefined): Audit | undefined {
  const runningId = site?.runningAudit?.id;
  const [trackedId, setTrackedId] = useState(runningId);
  if (runningId && runningId !== trackedId) setTrackedId(runningId);

  const audit = useAudit(trackedId);
  const refresh = useRefreshAfterRun();
  const handled = useRef<string | null>(null);
  const current = audit.data;

  useEffect(() => {
    if (!site || !current || current.siteId !== site.id || isRunning(current)) return;
    const key = `${current.id}:${current.status}`;
    if (handled.current === key) return;
    handled.current = key;
    // Only a run seen under way here gets a toast (not an old audit followed on arrival).
    if (!audit.isFetchedAfterMount && !site.runningAudit) return;
    const message = finishedMessage(current, site.name);
    showToaster(message.type, message.text);
    void refresh(site.id);
  }, [site, current, refresh, audit.isFetchedAfterMount]);

  // The polled copy is fresher than the list's: once it has stopped, nothing is running.
  if (current && current.siteId === site?.id) return isRunning(current) ? current : undefined;
  return site?.runningAudit ?? undefined;
}

/** Starts an audit with its toasts; a 409 `audit_running` reloads the sites list so the running audit shows. */
export function useRunAudit() {
  const start = useStartAudit();
  const queryClient = useQueryClient();
  const run = (site: Pick<AuditSite, 'id' | 'name'>) =>
    start.mutate(site.id, {
      onSuccess: () => showToaster('success', `Audit of ${site.name} started.`),
      onError: (error) => {
        const body = (error as { response?: { status?: number; data?: { error_type?: string } } }).response;
        if (body?.status === 409 && body.data?.error_type === 'audit_running') {
          void queryClient.invalidateQueries({ queryKey: auditKeys.sites() });
          showToaster('default', getApiErrorMessage(error, `An audit of ${site.name} is already running.`));
          return;
        }
        showToaster('error', getApiErrorMessage(error, 'Could not start the audit.'));
      },
    });
  return { run, starting: (siteId: number) => start.isPending && start.variables === siteId };
}

/** Cancels a running audit; a 409 `audit_not_running` (it finished meanwhile) reloads the audit so the page catches up. */
export function useCancelRun() {
  const cancel = useCancelAudit();
  const queryClient = useQueryClient();
  const stop = (audit: Audit, onDone: () => void) =>
    cancel.mutate(audit.id, {
      onSuccess: onDone,
      onError: (error) => {
        const status = (error as { response?: { status?: number } }).response?.status;
        if (status === 409) {
          onDone();
          void queryClient.invalidateQueries({ queryKey: auditKeys.audit(audit.id) });
        }
        showToaster('error', getApiErrorMessage(error, 'Could not cancel the audit.'));
      },
    });
  return { stop, cancelling: cancel.isPending };
}
