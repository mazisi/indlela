import axiosClient from '@/api/axiosClient';
import type { ResourcePage } from '@/types/pagination';
import type { ChangeEntry } from '@/types/history';
import type { Role, RoleInput, RolesResponse } from '../types';

export async function getRoles(): Promise<RolesResponse> {
  const { data } = await axiosClient.get<RolesResponse>('/settings/roles');
  return data;
}

export async function createRole(input: RoleInput): Promise<Role> {
  const { data } = await axiosClient.post<{ data: Role }>('/settings/roles', input);
  return data.data;
}

export async function updateRole(id: number, input: RoleInput): Promise<Role> {
  const { data } = await axiosClient.put<{ data: Role }>(`/settings/roles/${id}`, input);
  return data.data;
}

/** Replaces the role's permissions (the server adds View wherever another action is ticked). */
export async function updateRolePermissions(id: number, permissions: string[]): Promise<Role> {
  const { data } = await axiosClient.put<{ data: Role }>(`/settings/roles/${id}/permissions`, { permissions });
  return data.data;
}

/** 409 with a message while users still have the role. */
export async function deleteRole(id: number): Promise<void> {
  await axiosClient.delete(`/settings/roles/${id}`);
}

export async function getRoleHistory(page: number): Promise<ResourcePage<ChangeEntry>> {
  const { data } = await axiosClient.get<ResourcePage<ChangeEntry>>('/settings/roles/history', { params: { page } });
  return data;
}
