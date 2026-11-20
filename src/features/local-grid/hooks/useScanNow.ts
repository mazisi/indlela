import showToaster from '@/utils/showToaster';
import { getApiErrorMessage } from '@/utils/formErrorHandler';
import { apiErrorOf } from '../lib/errors';
import { PAUSED_MESSAGE } from '../lib/usage';
import type { Grid } from '../types';
import { useScanGrid } from './useLocalGrid';

/**
 * "Scan now" on a grid: queues a scan (the lists poll it from there) and
 * says so. 409 `scan_running`, `grid_inactive` and `local_grid_paused`, and
 * 429 `scan_limit` show the API's message (calm for the 409s).
 */
export function useScanNow(siteId: number) {
  const scan = useScanGrid(siteId);

  const run = (grid: Pick<Grid, 'id' | 'keyword'>, onQueued?: () => void) =>
    scan.mutate(grid.id, {
      onSuccess: () => {
        showToaster('default', `Scanning “${grid.keyword}” now. Results arrive in about a minute.`);
        onQueued?.();
      },
      onError: (error) => {
        const { status, errorType } = apiErrorOf(error);
        if (status === 409 && errorType === 'scan_running') {
          showToaster('default', getApiErrorMessage(error, `“${grid.keyword}” is already being scanned.`));
          return;
        }
        if (status === 409 && errorType === 'grid_inactive') {
          showToaster('default', getApiErrorMessage(error, `Resume “${grid.keyword}” to scan it.`));
          return;
        }
        if (status === 409) {
          // local_grid_paused (or another hold): never says why.
          showToaster('default', getApiErrorMessage(error, PAUSED_MESSAGE));
          return;
        }
        if (status === 429 || errorType === 'scan_limit') {
          showToaster('error', getApiErrorMessage(error, "You've used today's scans."));
          return;
        }
        showToaster('error', getApiErrorMessage(error, 'Could not start the scan.'));
      },
    });

  return { run, scanningId: scan.isPending ? scan.variables : undefined };
}
