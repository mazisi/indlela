import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addCompetitor,
  deleteCompetitor,
  getCompetitorAlerts,
  getCompetitorOverview,
  getCompetitors,
  getCompetitorSettings,
  getCompetitorSuggestions,
  getHeadToHead,
  updateCompetitor,
  updateCompetitorSettings,
} from '../api/competitorsApi';
import type { CompetitorInput, CompetitorSettings, CompetitorUpdate, H2HQuery } from '../types';
import { rankKeys } from './useRankTracking';

export const competitorKeys = {
  all: (siteId: number) => [...rankKeys.site(siteId), 'competitors'] as const,
  list: (siteId: number) => [...competitorKeys.all(siteId), 'list'] as const,
  suggestions: (siteId: number) => [...competitorKeys.all(siteId), 'suggestions'] as const,
  overview: (siteId: number) => [...competitorKeys.all(siteId), 'overview'] as const,
  headToHead: (siteId: number, query: H2HQuery) => [...competitorKeys.all(siteId), 'keywords', query] as const,
  alerts: (siteId: number, query: { page: number; perPage: number }) => [...competitorKeys.all(siteId), 'alerts', query] as const,
  settings: (siteId: number) => [...competitorKeys.all(siteId), 'settings'] as const,
};

export const useCompetitors = (siteId: number) => useQuery({ queryKey: competitorKeys.list(siteId), queryFn: () => getCompetitors(siteId) });

export const useCompetitorSuggestions = (siteId: number, enabled = true) =>
  useQuery({ queryKey: competitorKeys.suggestions(siteId), queryFn: () => getCompetitorSuggestions(siteId), enabled, staleTime: 5 * 60_000 });

export const useCompetitorOverview = (siteId: number, enabled = true) =>
  useQuery({ queryKey: competitorKeys.overview(siteId), queryFn: () => getCompetitorOverview(siteId), enabled });

export const useHeadToHead = (siteId: number, query: H2HQuery, enabled = true) =>
  useQuery({ queryKey: competitorKeys.headToHead(siteId, query), queryFn: () => getHeadToHead(siteId, query), enabled, placeholderData: keepPreviousData });

export const useCompetitorAlerts = (siteId: number, query: { page: number; perPage: number }) =>
  useQuery({ queryKey: competitorKeys.alerts(siteId, query), queryFn: () => getCompetitorAlerts(siteId, query), placeholderData: keepPreviousData });

export const useCompetitorSettings = (siteId: number) => useQuery({ queryKey: competitorKeys.settings(siteId), queryFn: () => getCompetitorSettings(siteId) });

/** Everything competitor-related on the site re-reads: the list, share of voice, head-to-head, suggestions. */
function useRefreshCompetitors() {
  const queryClient = useQueryClient();
  return (siteId: number) => queryClient.invalidateQueries({ queryKey: competitorKeys.all(siteId) });
}

export const useAddCompetitor = (siteId: number) => {
  const refresh = useRefreshCompetitors();
  return useMutation({ mutationFn: (input: CompetitorInput) => addCompetitor(siteId, input), onSuccess: () => refresh(siteId) });
};

export const useUpdateCompetitor = (siteId: number) => {
  const refresh = useRefreshCompetitors();
  return useMutation({ mutationFn: ({ id, update }: { id: number; update: CompetitorUpdate }) => updateCompetitor(id, update), onSuccess: () => refresh(siteId) });
};

export const useDeleteCompetitor = (siteId: number) => {
  const refresh = useRefreshCompetitors();
  return useMutation({ mutationFn: (id: number) => deleteCompetitor(id), onSuccess: () => refresh(siteId) });
};

export const useUpdateCompetitorSettings = (siteId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: CompetitorSettings) => updateCompetitorSettings(siteId, settings),
    onSuccess: (saved) => queryClient.setQueryData(competitorKeys.settings(siteId), saved),
  });
};
