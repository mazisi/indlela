import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import showToaster from '@/utils/showToaster';
import { getApiErrorMessage } from '@/utils/formErrorHandler';
import { formatRank } from '../lib/position';
import type { RankKeyword } from '../types';
import { rankKeys, useCheckKeyword, useRefreshSite } from './useRankTracking';

const errorType = (error: unknown) => (error as { response?: { status?: number; data?: { error_type?: string } } }).response;

/**
 * "Check now" for one keyword (an instant check). The list polls while the
 * keyword's check is pending (useKeywords); when it lands, this says so in a
 * toast and reloads the site's summary and the overview. A 409
 * `check_running` reloads the list so the running check shows; 409
 * `rank_checks_paused` and 429 `check_limit_reached` show the API's message
 * (usage is re-read by the mutation, so the action disables itself).
 */
export function useCheckNow(siteId: number, rows: RankKeyword[] | undefined) {
  const check = useCheckKeyword(siteId);
  const refresh = useRefreshSite();
  const queryClient = useQueryClient();
  /** Keywords checked from here whose result hasn't been announced yet. */
  const watching = useRef(new Set<number>());

  useEffect(() => {
    if (!rows || watching.current.size === 0) return;
    const landed = rows.filter((r) => watching.current.has(r.id) && r.lastCheckStatus !== 'pending');
    if (landed.length === 0) return;
    landed.forEach((r) => {
      watching.current.delete(r.id);
      if (r.lastCheckStatus === 'failed') showToaster('error', `The check of “${r.keyword}” failed. Try again later.`);
      else showToaster('success', r.position ? `“${r.keyword}” is at position ${formatRank(r.position)}.` : `“${r.keyword}” isn't in the top 100.`);
    });
    void refresh(siteId);
  }, [rows, refresh, siteId]);

  const run = (row: RankKeyword, onDone: () => void) =>
    check.mutate(row.id, {
      onSuccess: () => {
        watching.current.add(row.id);
        onDone();
        showToaster('default', `Checking “${row.keyword}” now…`);
      },
      onError: (error) => {
        onDone();
        const res = errorType(error);
        if (res?.status === 409 && res.data?.error_type === 'check_running') {
          void queryClient.invalidateQueries({ queryKey: rankKeys.keywords(siteId) });
          showToaster('default', getApiErrorMessage(error, `“${row.keyword}” is already being checked.`));
          return;
        }
        if (res?.status === 409 && res.data?.error_type === 'rank_checks_paused') {
          showToaster('default', getApiErrorMessage(error, 'Rank checks are paused for now.'));
          return;
        }
        if (res?.status === 429) {
          showToaster('error', getApiErrorMessage(error, "You've used today's instant checks."));
          return;
        }
        showToaster('error', getApiErrorMessage(error, 'Could not start the check.'));
      },
    });

  return { run, checking: check.isPending ? check.variables : undefined };
}
