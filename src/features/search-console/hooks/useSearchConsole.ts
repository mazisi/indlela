import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  connectGoogle,
  disconnectGoogle,
  getGoogleConnection,
  getGoogleProperties,
  getGscSites,
  getOverview,
  getReport,
  linkProperty,
  syncSite,
  unlinkProperty,
} from '../api/searchConsoleApi';
import { needsPolling } from '../lib/pageState';
import type { GscSite, ReportKey, ReportQuery, ReportScope } from '../types';

export const POLL_MS = 10_000;

export const scKeys = {
  all: ['search-console'] as const,
  connection: () => [...scKeys.all, 'connection'] as const,
  properties: () => [...scKeys.all, 'properties'] as const,
  sites: () => [...scKeys.all, 'sites'] as const,
  site: (siteId: number) => [...scKeys.all, 'site', siteId] as const,
  overview: (scope: ReportScope) => [...scKeys.site(scope.siteId), 'overview', scope] as const,
  report: (report: ReportKey, query: ReportQuery) => [...scKeys.site(query.siteId), report, query] as const,
};

export const useGoogleConnection = () => useQuery({ queryKey: scKeys.connection(), queryFn: getGoogleConnection });

/** Polls every 10 s while a linked site is still importing, so the page moves on by itself. */
export const useGscSites = (enabled = true) =>
  useQuery({
    queryKey: scKeys.sites(),
    queryFn: getGscSites,
    enabled,
    refetchInterval: (query) => (needsPolling(query.state.data) ? POLL_MS : false),
  });

export const useGoogleProperties = (enabled: boolean) =>
  useQuery({ queryKey: scKeys.properties(), queryFn: getGoogleProperties, enabled, staleTime: 60_000 });

export const useOverview = (scope: ReportScope, enabled = true) =>
  useQuery({ queryKey: scKeys.overview(scope), queryFn: () => getOverview(scope), enabled, placeholderData: keepPreviousData });

export const useReport = <K extends ReportKey>(report: K, query: ReportQuery) =>
  useQuery({ queryKey: scKeys.report(report, query), queryFn: () => getReport(report, query), placeholderData: keepPreviousData });

/** Sends the browser to Google's consent screen; Google comes back via the API with `?google=…`. */
export const useConnectGoogle = () =>
  useMutation({
    mutationFn: connectGoogle,
    onSuccess: (url) => window.location.assign(url),
  });

/** Everything on the page hangs off the connection: refresh it all. */
function useRefreshAll() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: scKeys.all });
}

export const useDisconnectGoogle = () => {
  const refresh = useRefreshAll();
  return useMutation({ mutationFn: disconnectGoogle, onSuccess: refresh });
};

/**
 * Writes the returned site into the sites list at once (its sync status then
 * drives polling). Reports refetch on their own when a sync finishes: the
 * site's `gscSyncedAt` is part of their query keys.
 */
function useSiteMutation<V>(fn: (vars: V) => Promise<GscSite>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (site) => {
      queryClient.setQueryData<GscSite[]>(scKeys.sites(), (sites) => sites?.map((s) => (s.id === site.id ? site : s)));
      void queryClient.invalidateQueries({ queryKey: scKeys.sites() });
    },
  });
}

export const useLinkProperty = () =>
  useSiteMutation(({ siteId, property }: { siteId: number; property: string }) => linkProperty(siteId, property));

export const useUnlinkProperty = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (siteId: number) => unlinkProperty(siteId),
    onSuccess: (_, siteId) => {
      queryClient.removeQueries({ queryKey: scKeys.site(siteId) });
      void queryClient.invalidateQueries({ queryKey: scKeys.sites() });
    },
  });
};

export const useSyncSite = () => useSiteMutation((siteId: number) => syncSite(siteId));
