import axiosClient from '@/api/axiosClient';
import type { ResourcePage } from '@/types/pagination';
import type { ChangeEntry } from '@/types/history';
import type { AppUser, BulkUserAction, UserInput, UserOptions, UsersPage, UsersQuery } from '../types';

export async function getUsers(query: UsersQuery): Promise<UsersPage> {
  const { data } = await axiosClient.get<UsersPage>('/users', {
    params: { page: query.page, perPage: query.perPage, search: query.search || undefined, status: query.status },
  });
  return data;
}

/** The workspace's roles (Owner included) and its active clients. */
export async function getUserOptions(): Promise<UserOptions> {
  const { data } = await axiosClient.get<UserOptions>('/users/options');
  return data;
}

/** Adds an active user; the API emails them a link to choose their password. */
export async function createUser(input: UserInput): Promise<AppUser> {
  const { data } = await axiosClient.post<{ data: AppUser }>('/users', input);
  return data.data;
}

export async function updateUser(id: number, input: UserInput): Promise<AppUser> {
  const { data } = await axiosClient.put<{ data: AppUser }>(`/users/${id}`, input);
  return data.data;
}

export async function deleteUser(id: number): Promise<void> {
  await axiosClient.delete(`/users/${id}`);
}

/** All or nothing (422 with the reason, e.g. it includes you). */
export async function bulkUpdateUsers(action: BulkUserAction, ids: number[]): Promise<{ affected: number }> {
  const { data } = await axiosClient.post<{ affected: number }>('/users/bulk', { action, ids });
  return data;
}

export async function unlockUser(id: number): Promise<void> {
  await axiosClient.post(`/users/${id}/unlock`);
}

export async function sendPasswordReset(id: number): Promise<void> {
  await axiosClient.post(`/users/${id}/password-reset`);
}

export async function getUserHistory(page: number): Promise<ResourcePage<ChangeEntry>> {
  const { data } = await axiosClient.get<ResourcePage<ChangeEntry>>('/users/history', { params: { page } });
  return data;
}
