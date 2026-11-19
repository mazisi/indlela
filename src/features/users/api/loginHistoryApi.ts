import axiosClient from '@/api/axiosClient';
import type { LoginEvent, LoginHistoryQuery, ResourcePage } from '../types';

export async function getLoginHistory(query: LoginHistoryQuery): Promise<ResourcePage<LoginEvent>> {
  const { data } = await axiosClient.get<ResourcePage<LoginEvent>>('/login-history', {
    // Empty filters are left off the URL.
    params: {
      page: query.page,
      perPage: query.perPage,
      search: query.search || undefined,
      event: query.event || undefined,
    },
  });
  return data;
}
