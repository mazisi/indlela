import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addKeywords,
  bulkKeywords,
  checkKeyword,
  deleteKeyword,
  getCannibalisation,
  getKeywordHistory,
  getKeywords,
  getRankSites,
  getRankSummary,
  getRankUsage,
  searchLocations,
  updateKeyword,
} from '../api/rankTrackingApi';
import type { AddKeywordsInput, BulkAction, Frequency, KeywordPage, KeywordQuery, KeywordUpdate, RankKeyword } from '../types';

/** A keyword list with a check under way is re-read this often. */
export const CHECK_POLL_MS = 3_000;

export const rankKeys = {
  all: ['rank-tracking'] as const,
  sites: () => [...rankKeys.all, 'sites'] as const,
  usage: () => [...rankKeys.all, 'usage'] as const,
  locations: (search: string) => [...rankKeys.all, 'locations', search] as const,
  site: (siteId: number) => [...rankKeys.all, 'site', siteId] as const,
  summary: (siteId: number) => [...rankKeys.site(siteId), 'summary'] as const,
  keywords: (siteId: number) => [...rankKeys.site(siteId), 'keywords'] as const,
  keywordList: (siteId: number, query: KeywordQuery) => [...rankKeys.keywords(siteId), query] as const,
  cannibalisation: (siteId: number, query: { page: number; perPage: number }) => [...rankKeys.site(siteId), 'cannibalisation', query] as const,
  history: (keywordId: number) => [...rankKeys.all, 'keyword', keywordId, 'history'] as const,
};

export const useRankSites = () => useQuery({ queryKey: rankKeys.sites(), queryFn: getRankSites });

export const useRankUsage = () => useQuery({ queryKey: rankKeys.usage(), queryFn: getRankUsage, staleTime: 60_000 });

export const useLocationSearch = (search: string, enabled: boolean) =>
  useQuery({
    queryKey: rankKeys.locations(search),
    queryFn: () => searchLocations(search),
    // Empty: the API suggests the home country's regions; one letter is too vague to search.
    enabled: enabled && search.length !== 1,
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  });

export const hasPendingCheck = (page: KeywordPage | undefined) => Boolean(page?.data.some((k) => k.lastCheckStatus === 'pending'));

/** Polls while a keyword on the page has a check under way ("Check now"), so its new position shows by itself. */
export const useKeywords = (siteId: number, query: KeywordQuery, enabled = true) =>
  useQuery({
    queryKey: rankKeys.keywordList(siteId, query),
    queryFn: () => getKeywords(siteId, query),
    enabled,
    placeholderData: keepPreviousData,
    refetchInterval: (q) => (hasPendingCheck(q.state.data) ? CHECK_POLL_MS : false),
  });

export const useRankSummary = (siteId: number, enabled = true) =>
  useQuery({ queryKey: rankKeys.summary(siteId), queryFn: () => getRankSummary(siteId), enabled });

export const useCannibalisation = (siteId: number, query: { page: number; perPage: number }) =>
  useQuery({ queryKey: rankKeys.cannibalisation(siteId, query), queryFn: () => getCannibalisation(siteId, query), placeholderData: keepPreviousData });

export const useKeywordHistory = (keywordId: number | undefined) =>
  useQuery({ queryKey: rankKeys.history(keywordId ?? 0), queryFn: () => getKeywordHistory(keywordId as number), enabled: Boolean(keywordId) });

/** Everything about a site's rankings (and the overview's figures and usage) after keywords change. */
export function useRefreshSite() {
  const queryClient = useQueryClient();
  return (siteId: number) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: rankKeys.site(siteId) }),
      queryClient.invalidateQueries({ queryKey: rankKeys.sites() }),
      queryClient.invalidateQueries({ queryKey: rankKeys.usage() }),
    ]);
}

/** Writes a returned keyword into every cached page of the site's list. */
function usePutKeyword() {
  const queryClient = useQueryClient();
  return (siteId: number, row: RankKeyword) =>
    queryClient.setQueriesData<KeywordPage>({ queryKey: rankKeys.keywords(siteId) }, (page) =>
      page ? { ...page, data: page.data.map((k) => (k.id === row.id ? row : k)) } : page,
    );
}

export const useAddKeywords = (siteId: number) => {
  const refresh = useRefreshSite();
  return useMutation({ mutationFn: (input: AddKeywordsInput) => addKeywords(siteId, input), onSuccess: () => refresh(siteId) });
};

export const useUpdateKeyword = (siteId: number) => {
  const put = usePutKeyword();
  const refresh = useRefreshSite();
  return useMutation({
    mutationFn: ({ id, update }: { id: number; update: KeywordUpdate }) => updateKeyword(id, update),
    onSuccess: (row) => {
      put(siteId, row);
      void refresh(siteId);
    },
  });
};

export const useDeleteKeyword = (siteId: number) => {
  const refresh = useRefreshSite();
  return useMutation({ mutationFn: (id: number) => deleteKeyword(id), onSuccess: () => refresh(siteId) });
};

export const useBulkKeywords = (siteId: number) => {
  const refresh = useRefreshSite();
  return useMutation({
    mutationFn: ({ action, ids, frequency }: { action: BulkAction; ids: number[]; frequency?: Frequency }) => bulkKeywords(siteId, action, ids, frequency),
    onSuccess: () => refresh(siteId),
  });
};

/**
 * Writes the pending keyword into the list at once, so polling starts without
 * waiting for a refetch. Usage is re-read either way: a check spends one of
 * today's instant checks, and a 429/409 means our figures are out of date.
 */
export const useCheckKeyword = (siteId: number) => {
  const put = usePutKeyword();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => checkKeyword(id),
    onSuccess: (row) => put(siteId, row),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: rankKeys.usage() }),
  });
};
