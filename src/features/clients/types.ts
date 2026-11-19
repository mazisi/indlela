import type { ResourcePage } from '@/types/pagination';
import type { Sort } from '@/types/sort';
import type { ActiveFilterValue } from '@/components/table/ActiveFilter';

/** A client of the workspace (an agency's customer, or an SME's own brand): the API's ClientResource. */
export interface Client {
  id: number;
  name: string;
  contactName: string | null;
  contactEmail: string | null;
  isActive: boolean;
  notes: string | null;
  sitesCount?: number;
  createdAt: string | null;
  updatedAt: string | null;
}

/** API sort keys (ClientController::SORTABLE). */
export const CLIENT_SORT_KEYS = ['name', 'contact_name', 'created_at', 'status'] as const;
export type ClientSortKey = (typeof CLIENT_SORT_KEYS)[number];

export interface ClientsQuery {
  page: number;
  perPage: number;
  search?: string;
  status?: ActiveFilterValue;
  sort?: Sort<ClientSortKey>;
}

export interface ClientsPage extends ResourcePage<Client> {
  summary: { active: number; total: number };
}

export interface ClientInput {
  name: string;
  contactName: string | null;
  contactEmail: string | null;
  notes: string | null;
  isActive: boolean;
}
