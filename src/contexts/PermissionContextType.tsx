import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useGetUserPermissions } from '@/hooks/useRoleManagement';
import type { AuthUser, WorkspaceMembership, WorkspaceRef } from '@/features/auth/types';
import { OWNER } from '@/features/auth/lib/roles';
import { ACTION_LABELS, MODULES, resourceOf, type Action, type Level, type ModuleKey } from '@/config/modules';

interface PermissionContextType {
  /** The user's permissions in the current workspace. */
  permissions: string[];
  /** The user's roles in the current workspace. */
  roles: string[];
  loading: boolean;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  /** A summary across a module's pages: approve if any page can be approved, edit if any can be changed… */
  levelFor: (module: ModuleKey) => Level;
  /** The actions the user has on one page (catalogue resource), in catalogue order. */
  actionsOn: (resource: string) => Action[];
  refreshPermissions: () => void;
  user: AuthUser | null;
  /** The current workspace. */
  workspace: WorkspaceRef | null;
  /** Every workspace the user belongs to, for the switcher. */
  workspaces: WorkspaceMembership[];
  /** Owner of the current workspace (full access). */
  isOwner: boolean;
}

// eslint-disable-next-line react-refresh/only-export-components -- context + provider + hook stay together (ported layout)
export const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

const NONE: never[] = [];

/**
 * Ported from workforce-app (without "View as"). Values are memoised so an
 * unchanged refresh doesn't re-render every usePermissions() consumer (the
 * whole nav). Everything here is for the current workspace: a workspace
 * switch replaces the cached GET /me, and with it all of this.
 */
export const PermissionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { data, isLoading: loading, refetch: refreshPermissions } = useGetUserPermissions();

  const permissions = data?.permissions ?? NONE;
  const roles = data?.roles ?? NONE;
  const user = data?.user ?? null;
  const workspace = data?.workspace ?? null;
  const workspaces = data?.workspaces ?? NONE;
  const isOwner = roles.includes(OWNER);

  const hasPermission = React.useCallback((permission: string) => permissions.includes(permission), [permissions]);
  const hasRole = React.useCallback((role: string) => roles.includes(role), [roles]);
  const hasAnyPermission = React.useCallback(
    (list: string[]) => list.some((permission) => permissions.includes(permission)),
    [permissions],
  );
  const actionsOn = React.useCallback(
    (resource: string) => (Object.keys(ACTION_LABELS) as Action[]).filter((a) => permissions.includes(`${a}_${resource}`)),
    [permissions],
  );
  const levelFor = React.useCallback(
    (module: ModuleKey): Level => {
      const def = MODULES.find((m) => m.key === module);
      const resources = def?.items ? [...new Set(def.items.map((i) => resourceOf(def, i)))] : [module];
      const held = new Set(resources.flatMap(actionsOn));
      if (held.has('approve')) return 'approve';
      if (held.has('create') || held.has('update') || held.has('delete')) return 'edit';
      return held.has('view') ? 'view' : 'none';
    },
    [actionsOn],
  );

  const value = React.useMemo(
    () => ({
      permissions,
      roles,
      loading,
      hasPermission,
      hasRole,
      hasAnyPermission,
      levelFor,
      actionsOn,
      refreshPermissions,
      user,
      workspace,
      workspaces,
      isOwner,
    }),
    [permissions, roles, loading, hasPermission, hasRole, hasAnyPermission, levelFor, actionsOn, refreshPermissions, user, workspace, workspaces, isOwner],
  );

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const usePermissions = (): PermissionContextType => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};
