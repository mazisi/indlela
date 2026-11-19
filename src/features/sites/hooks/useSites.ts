import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ActiveBulkAction } from '@/components/table/ActiveBulkBar';
import { bulkUpdateSites, deleteSite, getSiteHistory, getSites, saveSite } from '../api/sitesApi';
import type { SiteInput, SitesQuery } from '../types';

export const siteKeys = {
  all: ['sites'] as const,
  list: (query: SitesQuery) => [...siteKeys.all, 'list', query] as const,
  history: (page: number) => [...siteKeys.all, 'history', page] as const,
};

export const useSites = (query: SitesQuery) =>
  useQuery({ queryKey: siteKeys.list(query), queryFn: () => getSites(query), placeholderData: keepPreviousData });

/** Also drives the count on the History button, so it loads with the page. */
export const useSiteHistory = (page = 1) =>
  useQuery({ queryKey: siteKeys.history(page), queryFn: () => getSiteHistory(page), placeholderData: keepPreviousData });

/** A site change also changes the clients' site counts. */
function useInvalidatingMutation<V, R>(fn: (vars: V) => Promise<R>, refreshOnError = false) {
  const queryClient = useQueryClient();
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: siteKeys.all });
    void queryClient.invalidateQueries({ queryKey: ['clients'] });
  };
  return useMutation({ mutationFn: fn, onSuccess: refresh, onError: refreshOnError ? refresh : undefined });
}

export const useSaveSite = () => useInvalidatingMutation(({ id, input }: { id?: number; input: SiteInput }) => saveSite(id, input));

export const useDeleteSite = () => useInvalidatingMutation((id: number) => deleteSite(id));

/** Refreshes even on failure: a 422 can mean the list is out of date. */
export const useBulkUpdateSites = () =>
  useInvalidatingMutation(({ action, ids }: { action: ActiveBulkAction; ids: number[] }) => bulkUpdateSites(action, ids), true);
