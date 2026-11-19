import type { Action } from '@/config/modules';

export interface Role {
  id: number;
  name: string;
  description: string | null;
  /** Owner: always full access; can't be renamed, changed or deleted. */
  isSystem: boolean;
  /** Members see every client of the workspace, not only their assigned ones (always true for Owner). */
  allClients: boolean;
  usersCount: number;
  /** Permission names, e.g. `update_clients_sites`. */
  permissions: string[];
}

/** One page in the grid (a catalogue resource in App\Support\Permissions). */
export interface CatalogResource {
  key: string;
  label: string;
  /** The actions this page has, e.g. overview pages are view only. */
  actions: Action[];
  /** False for Users and access, Roles, Login history and Workspace (Owners only). */
  grantable: boolean;
}

/** A sidebar module and its pages. */
export interface CatalogGroup {
  key: string;
  label: string;
  resources: CatalogResource[];
}

export interface RolesResponse {
  roles: Role[];
  groups: CatalogGroup[];
}

export interface RoleInput {
  name: string;
  description: string;
  allClients: boolean;
}
