import axiosClient from '@/api/axiosClient';
import type { ResourcePage } from '@/types/pagination';
import type { ChangeEntry } from '@/types/history';
import type { WorkspaceRef } from '@/features/auth/types';

/** Settings › Workspace. */
export async function getWorkspace(): Promise<WorkspaceRef> {
  const { data } = await axiosClient.get<{ data: WorkspaceRef }>('/workspace');
  return data.data;
}

export interface WorkspaceUpdate {
  name?: string;
  logo?: File | null;
  removeLogo?: boolean;
  /** #rrggbb, or null for the default. */
  brandColor?: string | null;
}

/**
 * PATCH /workspace with `name`, `logo` (image ≤ 2 MB), `remove_logo` or `brand_color`. Sent
 * as multipart POST with `_method=PATCH`: PHP only parses multipart bodies on
 * POST, and Laravel routes the spoofed method to the PATCH route. FormData
 * keys aren't case-transformed, so they are snake_case here.
 */
export async function updateWorkspace(input: WorkspaceUpdate): Promise<WorkspaceRef> {
  const body = new FormData();
  body.append('_method', 'PATCH');
  if (input.name !== undefined) body.append('name', input.name);
  if (input.logo) body.append('logo', input.logo);
  if (input.removeLogo) body.append('remove_logo', '1');
  // Empty clears it (Laravel turns '' into null).
  if (input.brandColor !== undefined) body.append('brand_color', input.brandColor ?? '');
  const { data } = await axiosClient.post<{ data: WorkspaceRef }>('/workspace', body);
  return data.data;
}

export async function getWorkspaceHistory(page: number): Promise<ResourcePage<ChangeEntry>> {
  const { data } = await axiosClient.get<ResourcePage<ChangeEntry>>('/workspace/history', { params: { page } });
  return data;
}
