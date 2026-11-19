import { PermissionContext, usePermissions } from '@/contexts/PermissionContextType';
import React, { useContext } from 'react';
import { Navigate } from 'react-router';

interface AccessCtx {
  hasPermission: (p: string) => boolean;
  hasRole: (r: string) => boolean;
}

interface AccessOpts {
  permission?: string;
  /** Any (or all, with requireAll) of these permissions grants access. */
  permissions?: string[];
  role?: string;
  roles?: string[];
  /** Require ALL of the given permissions/roles (default: any). */
  requireAll?: boolean;
}

// Shared access resolution used by both the gate and the route guard.
function resolveAccess(ctx: AccessCtx, opts: AccessOpts): boolean {
  const { permission, permissions, role, roles, requireAll = false } = opts;
  if (permission) return ctx.hasPermission(permission);
  if (permissions && permissions.length > 0) {
    return requireAll
      ? permissions.every((p) => ctx.hasPermission(p))
      : permissions.some((p) => ctx.hasPermission(p));
  }
  if (roles && roles.length > 0) {
    return requireAll ? roles.every((r) => ctx.hasRole(r)) : roles.some((r) => ctx.hasRole(r));
  }
  if (role) return ctx.hasRole(role);
  // No permission/role supplied: deny by default, but warn in dev — an empty
  // guard silently hides its children/redirects, which is almost always a
  // misconfiguration rather than an intentional "deny everyone".
  if (import.meta.env.DEV) {
    console.warn(
      '[PermissionGate/ProtectedRoute] no permission or role provided — denying access by default.',
    );
  }
  return false;
}

// Hide UI (buttons, menu items, sections) unless the user has access. Reads the
// context directly so it degrades to "not permitted" when used outside a
// PermissionProvider, instead of throwing.
export const PermissionGate: React.FC<AccessOpts & {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback = null, ...opts }) => {
  const ctx = useContext(PermissionContext);
  if (!ctx) return <>{fallback}</>;
  if (ctx.loading) return <>{fallback}</>;
  return resolveAccess(ctx, opts) ? <>{children}</> : <>{fallback}</>;
};

// Route-level guard: redirects to /dashboard/unauthorized when the user lacks
// access. Use for whole pages.
export const ProtectedRoute: React.FC<AccessOpts & { children: React.ReactNode }> = ({
  children,
  ...opts
}) => {
  const perms = usePermissions();

  if (perms.loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!resolveAccess(perms, opts)) {
    return <Navigate to="/dashboard/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
