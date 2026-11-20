import axiosClient from '@/api/axiosClient';
import type { ResourcePage } from '@/types/pagination';
import type {
  AddKeywordsInput,
  AddKeywordsResult,
  BulkAction,
  CannibalisedRow,
  Frequency,
  KeywordHistoryPoint,
  KeywordPage,
  KeywordQuery,
  KeywordUpdate,
  RankKeyword,
  RankLocation,
  RankSite,
  RankSummary,
  RankUsage,
} from '../types';

/**
 * The client's case transform only camelises a letter after `_`, so
 * `change_7d` arrives as `change_7d` and `change_7d_avg` as `change_7dAvg`;
 * tidy those keys (at any depth) to `change7d` / `change7dAvg`.
 */
export function tidyDigitKeys<T>(value: unknown): T {
  if (Array.isArray(value)) return value.map((v) => tidyDigitKeys(v)) as T;
  if (value === null || typeof value !== 'object') return value as T;
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [k.replace(/_(\d)/g, '$1'), tidyDigitKeys(v)])) as T;
}

/** `-position` style, as the API takes it. */
export const toApiSort = (sort: { key: string; direction: 'asc' | 'desc' } | undefined) => (sort ? `${sort.direction === 'desc' ? '-' : ''}${sort.key}` : undefined);

/* ---- Workspace-wide ---- */

export async function getRankSites(): Promise<RankSite[]> {
  const { data } = await axiosClient.get<{ data: unknown[] }>('/rank-tracking/sites');
  return tidyDigitKeys<RankSite[]>(data.data);
}

export async function getRankUsage(): Promise<RankUsage> {
  const { data } = await axiosClient.get<{ data: RankUsage }>('/rank-tracking/usage');
  return data.data;
}

/** 409 `rank_checks_paused` while rank checks are on hold. */
export async function searchLocations(search: string): Promise<RankLocation[]> {
  const { data } = await axiosClient.get<{ data: RankLocation[] }>('/rank-tracking/locations', { params: { search } });
  return data.data;
}

/* ---- A site's keywords ---- */

export async function getKeywords(siteId: number, query: KeywordQuery): Promise<KeywordPage> {
  const { data } = await axiosClient.get<ResourcePage<unknown>>(`/sites/${siteId}/rank-keywords`, {
    params: {
      page: query.page,
      perPage: query.perPage,
      search: query.search || undefined,
      device: query.device,
      location: query.location,
      tag: query.tag,
      bucket: query.bucket,
      isKey: query.isKey ? 1 : undefined,
      sort: toApiSort(query.sort),
    },
  });
  return { ...data, data: tidyDigitKeys<RankKeyword[]>(data.data) };
}

export async function addKeywords(siteId: number, input: AddKeywordsInput): Promise<AddKeywordsResult> {
  const { data } = await axiosClient.post<AddKeywordsResult>(`/sites/${siteId}/rank-keywords`, input);
  return data;
}

export async function updateKeyword(id: number, update: KeywordUpdate): Promise<RankKeyword> {
  const { data } = await axiosClient.put<{ data: unknown }>(`/rank-keywords/${id}`, update);
  return tidyDigitKeys<RankKeyword>(data.data);
}

export async function deleteKeyword(id: number): Promise<void> {
  await axiosClient.delete(`/rank-keywords/${id}`);
}

export async function bulkKeywords(siteId: number, action: BulkAction, ids: number[], frequency?: Frequency): Promise<void> {
  await axiosClient.post(`/sites/${siteId}/rank-keywords/bulk`, { action, ids, frequency });
}

/**
 * 202 with the keyword (its check pending). 409 `check_running` when one is
 * already under way, 409 `rank_checks_paused` while checks are on hold, 429
 * `check_limit_reached` past the workspace's daily instant checks, 502
 * `dataforseo_error` when the provider refuses.
 */
export async function checkKeyword(id: number): Promise<RankKeyword> {
  const { data } = await axiosClient.post<{ data: unknown }>(`/rank-keywords/${id}/check`);
  return tidyDigitKeys<RankKeyword>(data.data);
}

export async function getKeywordHistory(id: number, days = 90): Promise<KeywordHistoryPoint[]> {
  const { data } = await axiosClient.get<{ data: KeywordHistoryPoint[] }>(`/rank-keywords/${id}/history`, { params: { days } });
  return data.data;
}

/* ---- A site's summary ---- */

export async function getRankSummary(siteId: number): Promise<RankSummary> {
  const { data } = await axiosClient.get<{ data: unknown }>(`/sites/${siteId}/rank-tracking/summary`);
  return tidyDigitKeys<RankSummary>(data.data);
}

export async function getCannibalisation(siteId: number, query: { page: number; perPage: number }): Promise<ResourcePage<CannibalisedRow>> {
  const { data } = await axiosClient.get<ResourcePage<Omit<CannibalisedRow, 'id'>>>(`/sites/${siteId}/rank-tracking/cannibalisation`, {
    params: { page: query.page, perPage: query.perPage },
  });
  // One row per tracked keyword: its id is stable, and the shared DataTable wants one.
  return { ...data, data: data.data.map((row) => ({ ...row, id: row.keywordId })) };
}
