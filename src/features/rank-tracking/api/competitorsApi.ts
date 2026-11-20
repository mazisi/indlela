import axiosClient from '@/api/axiosClient';
import type { ResourcePage } from '@/types/pagination';
import type {
  Competitor,
  CompetitorAlert,
  CompetitorInput,
  CompetitorOverview,
  CompetitorSettings,
  CompetitorSuggestion,
  CompetitorUpdate,
  H2HQuery,
  HeadToHeadRow,
} from '../types';
import { toApiSort } from './rankTrackingApi';

/* ---- A site's competitors ---- */

export async function getCompetitors(siteId: number): Promise<Competitor[]> {
  const { data } = await axiosClient.get<{ data: Competitor[] }>(`/sites/${siteId}/competitors`);
  return data.data;
}

/** Hosts seen most in the site's top 10s; empty until a check has recorded the results' domains. */
export async function getCompetitorSuggestions(siteId: number): Promise<CompetitorSuggestion[]> {
  const { data } = await axiosClient.get<{ data: CompetitorSuggestion[] }>(`/sites/${siteId}/competitors/suggestions`);
  return data.data;
}

/** 422 on `domain`: not a domain, the site's own, already added, or the per-site limit reached. */
export async function addCompetitor(siteId: number, input: CompetitorInput): Promise<Competitor> {
  const { data } = await axiosClient.post<{ data: Competitor }>(`/sites/${siteId}/competitors`, input);
  return data.data;
}

/** 422 on `is_active` when resuming would pass the per-site limit. */
export async function updateCompetitor(id: number, update: CompetitorUpdate): Promise<Competitor> {
  const { data } = await axiosClient.put<{ data: Competitor }>(`/competitors/${id}`, update);
  return data.data;
}

export async function deleteCompetitor(id: number): Promise<void> {
  await axiosClient.delete(`/competitors/${id}`);
}

/* ---- Share of voice, head-to-head ---- */

export async function getCompetitorOverview(siteId: number): Promise<CompetitorOverview> {
  const { data } = await axiosClient.get<{ data: CompetitorOverview }>(`/sites/${siteId}/competitors/overview`);
  return data.data;
}

export async function getHeadToHead(siteId: number, query: H2HQuery): Promise<ResourcePage<HeadToHeadRow>> {
  const { data } = await axiosClient.get<ResourcePage<Omit<HeadToHeadRow, 'id'>>>(`/sites/${siteId}/competitors/keywords`, {
    params: { page: query.page, perPage: query.perPage, search: query.search || undefined, only: query.only, sort: toApiSort(query.sort) },
  });
  // One row per tracked keyword: its id is stable, and the shared DataTable wants one.
  return { ...data, data: data.data.map((row) => ({ ...row, id: row.keywordId })) };
}

/* ---- Overtake alerts ---- */

export async function getCompetitorAlerts(siteId: number, query: { page: number; perPage: number }): Promise<ResourcePage<CompetitorAlert>> {
  const { data } = await axiosClient.get<ResourcePage<CompetitorAlert>>(`/sites/${siteId}/competitor-alerts`, { params: query });
  return data;
}

export async function getCompetitorSettings(siteId: number): Promise<CompetitorSettings> {
  const { data } = await axiosClient.get<{ data: CompetitorSettings }>(`/sites/${siteId}/competitor-settings`);
  return data.data;
}

export async function updateCompetitorSettings(siteId: number, settings: CompetitorSettings): Promise<CompetitorSettings> {
  const { data } = await axiosClient.put<{ data: CompetitorSettings }>(`/sites/${siteId}/competitor-settings`, settings);
  return data.data;
}
