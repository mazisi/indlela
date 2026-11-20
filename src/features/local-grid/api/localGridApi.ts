import axiosClient from '@/api/axiosClient';
import type {
  BusinessCandidate,
  BusinessSearchInput,
  Competitor,
  CreateGridResult,
  Grid,
  GridDetail,
  GridInput,
  GridUpdate,
  LocalGridSite,
  LocalGridUsage,
  Scan,
  ScanDetail,
  ScanError,
} from '../types';

/* ---- Workspace-wide ---- */

export async function getLocalGridSites(): Promise<LocalGridSite[]> {
  const { data } = await axiosClient.get<{ data: LocalGridSite[] }>('/local-grid/sites');
  return data.data;
}

export async function getLocalGridUsage(): Promise<LocalGridUsage> {
  const { data } = await axiosClient.get<{ data: LocalGridUsage }>('/local-grid/usage');
  return data.data;
}

/* ---- A site's grids ---- */

export async function getSiteGrids(siteId: number): Promise<Grid[]> {
  const { data } = await axiosClient.get<{ data: Grid[] }>(`/sites/${siteId}/local-grids`);
  return data.data;
}

/** Up to 10 Google Maps listings. 429 `search_limit` past today's searches, 409 `local_grid_paused`, 502 `search_failed`. */
export async function searchBusinesses(siteId: number, input: BusinessSearchInput): Promise<BusinessCandidate[]> {
  const { data } = await axiosClient.post<{ data: BusinessCandidate[] }>(`/sites/${siteId}/local-grids/business-search`, input);
  return data.data;
}

/**
 * 201; 422 over the grid limit (on `keyword`) or for a duplicate. With
 * `scanNow`, a scan that can't start (paused, today's scans used) comes back
 * as `scan_error` beside the saved grid.
 */
export async function createGrid(siteId: number, input: GridInput): Promise<CreateGridResult> {
  const { data } = await axiosClient.post<{ data: Grid; scanError?: ScanError | null }>(`/sites/${siteId}/local-grids`, input);
  return { grid: data.data, scanError: data.scanError ?? null };
}

/* ---- One grid ---- */

export async function getGrid(gridId: number): Promise<GridDetail> {
  const { data } = await axiosClient.get<{ data: GridDetail }>(`/local-grids/${gridId}`);
  return data.data;
}

export async function updateGrid(gridId: number, update: GridUpdate): Promise<Grid> {
  const { data } = await axiosClient.put<{ data: Grid }>(`/local-grids/${gridId}`, update);
  return data.data;
}

export async function deleteGrid(gridId: number): Promise<void> {
  await axiosClient.delete(`/local-grids/${gridId}`);
}

/**
 * 202 with the queued scan. 409 `scan_running` while one is queued or
 * running, 409 `grid_inactive` on a paused grid, 409 `local_grid_paused`
 * while scans are on hold, 429 `scan_limit` past today's scans.
 */
export async function scanGrid(gridId: number): Promise<Scan> {
  const { data } = await axiosClient.post<{ data: Scan }>(`/local-grids/${gridId}/scan`);
  return data.data;
}

/** 404 once its grid is deleted. The scan with its points, and the competitors next to it in the body (given an id here, for the table). */
export async function getScan(scanId: number): Promise<ScanDetail> {
  const { data } = await axiosClient.get<{ data: Omit<ScanDetail, 'competitors'>; competitors?: Omit<Competitor, 'id'>[] }>(`/local-grid-scans/${scanId}`);
  return { ...data.data, competitors: (data.competitors ?? []).map((c, i) => ({ ...c, id: i + 1 })) };
}
