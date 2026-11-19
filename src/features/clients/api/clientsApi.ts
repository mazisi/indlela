import axiosClient from '@/api/axiosClient';
import type { ResourcePage } from '@/types/pagination';
import type { ChangeEntry } from '@/types/history';
import type { ActiveBulkAction } from '@/components/table/ActiveBulkBar';
import type { Client, ClientInput, ClientsPage, ClientsQuery } from '../types';

const BASE = '/clients';

// Sort keys are API column names, sent as values so the case transform leaves them alone.
export async function getClients(query: ClientsQuery): Promise<ClientsPage> {
  const { data } = await axiosClient.get<ClientsPage>(BASE, {
    params: {
      page: query.page,
      perPage: query.perPage,
      search: query.search || undefined,
      status: query.status,
      sort: query.sort?.key,
      direction: query.sort?.direction,
    },
  });
  return data;
}

export async function getClient(id: number): Promise<Client> {
  const { data } = await axiosClient.get<{ data: Client }>(`${BASE}/${id}`);
  return data.data;
}

export async function saveClient(id: number | undefined, input: ClientInput): Promise<Client> {
  const { data } = id ? await axiosClient.put<{ data: Client }>(`${BASE}/${id}`, input) : await axiosClient.post<{ data: Client }>(BASE, input);
  return data.data;
}

/** 409 while the client has sites. */
export async function deleteClient(id: number): Promise<void> {
  await axiosClient.delete(`${BASE}/${id}`);
}

/** All or nothing; 409 when deleting a client with sites. */
export async function bulkUpdateClients(action: ActiveBulkAction, ids: number[]): Promise<{ affected: number }> {
  const { data } = await axiosClient.post<{ affected: number }>(`${BASE}/bulk`, { action, ids });
  return data;
}

export async function getClientHistory(page: number): Promise<ResourcePage<ChangeEntry>> {
  const { data } = await axiosClient.get<ResourcePage<ChangeEntry>>(`${BASE}/history`, { params: { page } });
  return data;
}
