import axiosClient from '@/api/axiosClient';
import type { ResourcePage } from '@/types/pagination';
import type { PlatformUsage, WorkspaceUsage, WorkspaceUsageQuery } from '../types';

/** Company spend, provider state, limits, totals and the 6-month series. 403 without `view_platform_usage`. */
export async function getPlatformUsage(): Promise<PlatformUsage> {
  const { data } = await axiosClient.get<{ data: PlatformUsage }>('/platform/usage');
  return data.data;
}

/** Every workspace's usage, server-paginated, searched and sorted (`-key` = descending). */
export async function getWorkspaceUsage(query: WorkspaceUsageQuery): Promise<ResourcePage<WorkspaceUsage>> {
  const { data } = await axiosClient.get<ResourcePage<WorkspaceUsage>>('/platform/usage/workspaces', {
    params: {
      page: query.page,
      perPage: query.perPage,
      search: query.search || undefined,
      sort: `${query.sort.direction === 'desc' ? '-' : ''}${query.sort.key}`,
    },
  });
  return data;
}

/** A workspace's own keyword limit; null returns it to the default. 422 on `rank_keyword_limit`. */
export async function updateWorkspaceLimit(id: number, rankKeywordLimit: number | null): Promise<WorkspaceUsage> {
  const { data } = await axiosClient.patch<{ data: WorkspaceUsage }>(`/platform/workspaces/${id}/limits`, { rankKeywordLimit });
  return data.data;
}
