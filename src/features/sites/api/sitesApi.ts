import axiosClient from '@/api/axiosClient';
import type { ResourcePage } from '@/types/pagination';
import type { ChangeEntry } from '@/types/history';
import type { ActiveBulkAction } from '@/components/table/ActiveBulkBar';
import type { Site, SiteInput, SitesPage, SitesQuery } from '../types';

const BASE = '/sites';

// Sort keys are API column names, sent as values so the case transform leaves them alone.
export async function getSites(query: SitesQuery): Promise<SitesPage> {
  const { data } = await axiosClient.get<SitesPage>(BASE, {
    params: {
      page: query.page,
      perPage: query.perPage,
      clientId: query.clientId,
      search: query.search || undefined,
      status: query.status,
      sort: query.sort?.key,
      direction: query.sort?.direction,
    },
  });
  return data;
}

export async function getSite(id: number): Promise<Site> {
  const { data } = await axiosClient.get<{ data: Site }>(`${BASE}/${id}`);
  return data.data;
}

export async function saveSite(id: number | undefined, input: SiteInput): Promise<Site> {
  if (id) {
    // The client can't change on an edit (the API refuses client_id there).
    const { data } = await axiosClient.put<{ data: Site }>(`${BASE}/${id}`, { name: input.name, url: input.url, isActive: input.isActive });
    return data.data;
  }
  const { data } = await axiosClient.post<{ data: Site }>(BASE, input);
  return data.data;
}

export async function deleteSite(id: number): Promise<void> {
  await axiosClient.delete(`${BASE}/${id}`);
}

/** All or nothing. */
export async function bulkUpdateSites(action: ActiveBulkAction, ids: number[]): Promise<{ affected: number }> {
  const { data } = await axiosClient.post<{ affected: number }>(`${BASE}/bulk`, { action, ids });
  return data;
}

export async function getSiteHistory(page: number): Promise<ResourcePage<ChangeEntry>> {
  const { data } = await axiosClient.get<ResourcePage<ChangeEntry>>(`${BASE}/history`, { params: { page } });
  return data;
}
