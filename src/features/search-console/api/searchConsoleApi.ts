import axiosClient from '@/api/axiosClient';
import type { ResourcePage } from '@/types/pagination';
import type { GoogleConnection, GscProperty, GscSite, Overview, ReportKey, ReportPage, ReportQuery, ReportScope } from '../types';

/* ---- Google account (one per workspace) ---- */

export async function getGoogleConnection(): Promise<GoogleConnection | null> {
  const { data } = await axiosClient.get<{ data: GoogleConnection | null }>('/google/connection');
  return data.data ?? null;
}

/** The Google consent URL to send the browser to; Google returns to the API, which returns here with `?google=…`. */
export async function connectGoogle(): Promise<string> {
  const { data } = await axiosClient.post<{ url: string }>('/google/connect');
  return data.url;
}

export async function disconnectGoogle(): Promise<void> {
  await axiosClient.delete('/google/connection');
}

/** 409 `google_not_connected` when there is no usable connection. */
export async function getGoogleProperties(): Promise<GscProperty[]> {
  const { data } = await axiosClient.get<{ data: GscProperty[] }>('/google/properties');
  return data.data;
}

/* ---- Sites ---- */

export async function getGscSites(): Promise<GscSite[]> {
  const { data } = await axiosClient.get<{ data: GscSite[] }>('/search-console/sites');
  return data.data;
}

export async function linkProperty(siteId: number, property: string): Promise<GscSite> {
  const { data } = await axiosClient.put<{ data: GscSite }>(`/sites/${siteId}/search-console`, { property });
  return data.data;
}

/** Also deletes the site's stored Search Console data. */
export async function unlinkProperty(siteId: number): Promise<void> {
  await axiosClient.delete(`/sites/${siteId}/search-console`);
}

export async function syncSite(siteId: number): Promise<GscSite> {
  const { data } = await axiosClient.post<{ data: GscSite }>(`/sites/${siteId}/search-console/sync`);
  return data.data;
}

/* ---- Reports ---- */

const scopeParams = ({ start, end, compare }: ReportScope) => ({ start, end, compare });

export async function getOverview(scope: ReportScope): Promise<Overview> {
  const { data } = await axiosClient.get<Overview>(`/sites/${scope.siteId}/search-console/overview`, { params: scopeParams(scope) });
  return data;
}

/** `-clicks` style, as the API takes it (absent = the report's default order). */
export const toApiSort = (sort: ReportQuery['sort']) => (sort ? `${sort.direction === 'desc' ? '-' : ''}${sort.key}` : undefined);

/**
 * The client's case transform only camelises a letter after `_`, so
 * `clicks_last_28` arrives as `clicksLast_28`; tidy those keys here.
 */
function tidyKeys(row: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(row).map(([k, v]) => [k.replace(/_(\d)/g, '$1'), v]));
}

export async function getReport<K extends ReportKey>(report: K, query: ReportQuery): Promise<ReportPage<K>> {
  const { data } = await axiosClient.get<ResourcePage<Record<string, unknown>>>(`/sites/${query.siteId}/search-console/${report}`, {
    params: {
      ...scopeParams(query),
      page: query.page,
      perPage: query.perPage,
      search: query.search || undefined,
      sort: toApiSort(query.sort),
    },
  });
  const offset = (data.meta.currentPage - 1) * data.meta.perPage;
  // Report rows have no id of their own; their place in the result is stable for a page.
  const rows = data.data.map((row, i) => ({ ...tidyKeys(row), id: offset + i + 1 }));
  return { ...data, data: rows } as unknown as ReportPage<K>;
}
