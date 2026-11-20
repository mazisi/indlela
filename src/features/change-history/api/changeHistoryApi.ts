import axiosClient from '@/api/axiosClient';
import type { ResourcePage } from '@/types/pagination';
import type { ChangeHistoryEntry, ChangeHistoryFilters, ChangeHistoryOptions, ChangeHistoryQuery } from '../types';

const BASE = '/settings/change-history';

// Empty filters are left off the URL.
const params = (f: ChangeHistoryFilters) => ({
  pageKey: f.pageKey || undefined,
  user: f.user || undefined,
  action: f.action || undefined,
  search: f.search || undefined,
  from: f.from || undefined,
  to: f.to || undefined,
});

export async function getChangeHistory(query: ChangeHistoryQuery): Promise<ResourcePage<ChangeHistoryEntry>> {
  const { data } = await axiosClient.get<ResourcePage<ChangeHistoryEntry>>(BASE, { params: { ...params(query), page: query.page, perPage: query.perPage } });
  return data;
}

export async function getChangeHistoryOptions(): Promise<ChangeHistoryOptions> {
  const { data } = await axiosClient.get<ChangeHistoryOptions>(`${BASE}/options`);
  return data;
}

/** 409 `{message, error_type}` when it can't be undone (changed since, gone, already undone…). */
export async function undoChange(id: number): Promise<ChangeHistoryEntry> {
  const { data } = await axiosClient.post<{ data: ChangeHistoryEntry }>(`${BASE}/${id}/undo`);
  return data.data;
}
