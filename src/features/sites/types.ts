import type { ResourcePage } from '@/types/pagination';
import type { Sort } from '@/types/sort';
import type { ActiveFilterValue } from '@/components/table/ActiveFilter';

/** A website of a client: the API's SiteResource. */
export interface Site {
  id: number;
  clientId: number;
  client?: { id: number; name: string };
  name: string;
  /** Normalised by the API, e.g. https://www.example.co.za */
  url: string;
  /** e.g. example.co.za; one site per domain in a workspace. */
  domain: string;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

/** API sort keys (SiteController::SORTABLE). */
export const SITE_SORT_KEYS = ['name', 'domain', 'created_at', 'status'] as const;
export type SiteSortKey = (typeof SITE_SORT_KEYS)[number];

export interface SitesQuery {
  page: number;
  perPage: number;
  clientId?: number;
  search?: string;
  status?: ActiveFilterValue;
  sort?: Sort<SiteSortKey>;
}

export interface SitesPage extends ResourcePage<Site> {
  summary: { active: number; total: number };
}

/** `clientId` only when adding: a site stays with the client it was added to. */
export interface SiteInput {
  clientId?: number;
  name: string | null;
  url: string;
  isActive: boolean;
}
