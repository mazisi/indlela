import { Building2, FileBarChart, LayoutDashboard, ScanSearch, Search, Settings, TrendingUp, type LucideIcon } from 'lucide-react';

/**
 * The menu. Access is per page: each sub-item (or a module without
 * sub-items) is a resource in indlela-api's App\Support\Permissions
 * catalogue, with permissions `{action}_{resource}` (e.g.
 * `update_clients_sites`). Keep the two in step.
 */
export type Action = 'view' | 'create' | 'update' | 'delete' | 'approve';

export interface SubItem {
  key: string;
  label: string;
  /** Catalogue resource; defaults to `{module}_{item}` (hyphens → underscores). */
  resource?: string;
  /** Needed to open the page; defaults to `view` ("Add …" pages need `create`). */
  action?: Action;
}

export interface ModuleDef {
  key: ModuleKey;
  label: string;
  icon: LucideIcon;
  /** Route segment under /dashboard ('' = the dashboard itself). */
  path: string;
  items?: readonly SubItem[];
}

export type ModuleKey = 'dashboard' | 'clients' | 'search_console' | 'site_audit' | 'rank_tracking' | 'reports' | 'settings';

export const MODULES: readonly ModuleDef[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '' },
  {
    key: 'clients',
    label: 'Clients',
    icon: Building2,
    path: 'clients',
    items: [
      { key: 'clients', label: 'Clients' },
      { key: 'sites', label: 'Sites' },
    ],
  },
  { key: 'search_console', label: 'Search Console', icon: Search, path: 'search-console' },
  { key: 'site_audit', label: 'Site audit', icon: ScanSearch, path: 'site-audit' },
  { key: 'rank_tracking', label: 'Rank tracking', icon: TrendingUp, path: 'rank-tracking' },
  { key: 'reports', label: 'Reports', icon: FileBarChart, path: 'reports' },
  {
    key: 'settings',
    label: 'Settings',
    icon: Settings,
    path: 'settings',
    items: [
      // Owners only (not grantable to other roles), except Email templates.
      { key: 'users', label: 'Users and access' },
      { key: 'roles', label: 'Roles and permissions' },
      { key: 'login-history', label: 'Login history' },
      { key: 'email-templates', label: 'Email templates' },
      { key: 'workspace', label: 'Workspace' },
    ],
  },
];

export const moduleHref = (m: ModuleDef, item?: SubItem) =>
  ['/dashboard', m.path, item?.key].filter(Boolean).join('/');

/** The catalogue resource behind a menu entry (a module without sub-items is one page). */
export const resourceOf = (m: ModuleDef, item?: SubItem) =>
  item ? (item.resource ?? `${m.key}_${item.key.replace(/-/g, '_')}`) : m.key;

/** The permission needed to open a menu entry, e.g. `view_leave_register`. */
export const permissionFor = (m: ModuleDef, item?: SubItem) => `${item?.action ?? 'view'}_${resourceOf(m, item)}`;

/** A summary of a user's access to a whole module, for badges. */
export type Level = 'none' | 'view' | 'edit' | 'approve';

export const LEVEL_LABELS: Record<Level, string> = {
  none: 'No access',
  view: 'View',
  edit: 'Edit',
  approve: 'Approve',
};

export const ACTION_LABELS: Record<Action, string> = {
  view: 'View',
  create: 'Create',
  update: 'Update',
  delete: 'Delete',
  approve: 'Approve',
};
