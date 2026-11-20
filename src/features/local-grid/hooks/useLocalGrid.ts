import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createGrid,
  deleteGrid,
  getGrid,
  getLocalGridSites,
  getLocalGridUsage,
  getScan,
  getSiteGrids,
  scanGrid,
  searchBusinesses,
  updateGrid,
} from '../api/localGridApi';
import { isNotFound } from '../lib/errors';
import { isScanActive } from '../lib/labels';
import type { BusinessSearchInput, Grid, GridDetail, GridInput, GridUpdate, ScanDetail } from '../types';

/** A scan under way is re-read this often. */
export const SCAN_POLL_MS = 3_000;

export const localGridKeys = {
  all: ['local-grid'] as const,
  sites: () => [...localGridKeys.all, 'sites'] as const,
  usage: () => [...localGridKeys.all, 'usage'] as const,
  siteGrids: (siteId: number) => [...localGridKeys.all, 'site', siteId] as const,
  grid: (gridId: number) => [...localGridKeys.all, 'grid', gridId] as const,
  scan: (scanId: number) => [...localGridKeys.all, 'scan', scanId] as const,
};

export const useLocalGridSites = () => useQuery({ queryKey: localGridKeys.sites(), queryFn: getLocalGridSites });

export const useLocalGridUsage = () => useQuery({ queryKey: localGridKeys.usage(), queryFn: getLocalGridUsage, staleTime: 60_000 });

const anyActive = (grids: Grid[] | undefined) => Boolean(grids?.some((g) => isScanActive(g.latestScan)));

/** Polls while one of the site's grids is being scanned, so its figures land by themselves. */
export const useSiteGrids = (siteId: number, enabled = true) =>
  useQuery({
    queryKey: localGridKeys.siteGrids(siteId),
    queryFn: () => getSiteGrids(siteId),
    enabled,
    refetchInterval: (q) => (anyActive(q.state.data) ? SCAN_POLL_MS : false),
  });

/** Polls while its latest scan is under way, so a finished scan joins the history. */
export const useGrid = (gridId: number) =>
  useQuery({
    queryKey: localGridKeys.grid(gridId),
    queryFn: () => getGrid(gridId),
    enabled: Number.isFinite(gridId) && gridId > 0,
    refetchInterval: (q) => (isScanActive((q.state.data as GridDetail | undefined)?.latestScan) ? SCAN_POLL_MS : false),
  });

/** A scan and its points: polled every 3 s while queued or running; a finished scan never changes. */
export const useScan = (scanId: number | undefined) =>
  useQuery({
    queryKey: localGridKeys.scan(scanId ?? 0),
    queryFn: () => getScan(scanId as number),
    enabled: Boolean(scanId),
    // A 404 (its grid was deleted) won't change on a retry.
    retry: (count, error) => !isNotFound(error) && count < 3,
    staleTime: (q) => (isScanActive(q.state.data as ScanDetail | undefined) ? 0 : Infinity),
    refetchInterval: (q) => (isScanActive(q.state.data as ScanDetail | undefined) ? SCAN_POLL_MS : false),
  });

/** After grids change: the site's list, the overview and the allowance. */
export function useRefreshLocalGrid() {
  const queryClient = useQueryClient();
  return (siteId: number, gridId?: number) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: localGridKeys.siteGrids(siteId) }),
      queryClient.invalidateQueries({ queryKey: localGridKeys.sites() }),
      queryClient.invalidateQueries({ queryKey: localGridKeys.usage() }),
      ...(gridId ? [queryClient.invalidateQueries({ queryKey: localGridKeys.grid(gridId) })] : []),
    ]);
}

/** Each search spends one of today's searches: the allowance is re-read either way. */
export const useBusinessSearch = (siteId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BusinessSearchInput) => searchBusinesses(siteId, input),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: localGridKeys.usage() }),
  });
};

export const useCreateGrid = (siteId: number) => {
  const refresh = useRefreshLocalGrid();
  // Usage is re-read either way: a scan_error means our figures were stale.
  return useMutation({ mutationFn: (input: GridInput) => createGrid(siteId, input), onSettled: () => refresh(siteId) });
};

export const useUpdateGrid = (siteId: number) => {
  const refresh = useRefreshLocalGrid();
  return useMutation({
    mutationFn: ({ id, update }: { id: number; update: GridUpdate }) => updateGrid(id, update),
    onSuccess: (grid) => refresh(siteId, grid.id),
  });
};

export const useDeleteGrid = (siteId: number) => {
  const refresh = useRefreshLocalGrid();
  return useMutation({ mutationFn: (id: number) => deleteGrid(id), onSuccess: () => refresh(siteId) });
};

/** The queued scan shows at once (the lists start polling); a 409/429 means our figures are stale, so everything is re-read. */
export const useScanGrid = (siteId: number) => {
  const refresh = useRefreshLocalGrid();
  return useMutation({
    mutationFn: (gridId: number) => scanGrid(gridId),
    onSettled: (_scan, _error, gridId) => refresh(siteId, gridId),
  });
};
