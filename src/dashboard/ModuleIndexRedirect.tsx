import { Navigate } from 'react-router';
import { usePermissions } from '@/contexts/PermissionContextType';
import { MODULES, moduleHref, permissionFor, type ModuleKey } from '@/config/modules';

/** /dashboard/<module> → the first item of that module this user may open. */
export default function ModuleIndexRedirect({ moduleKey }: { moduleKey: ModuleKey }) {
  const { hasPermission, loading } = usePermissions();
  const module = MODULES.find((m) => m.key === moduleKey)!;
  if (loading) return null;

  const first = (module.items ?? []).find((i) => hasPermission(permissionFor(module, i)));
  return <Navigate to={first ? moduleHref(module, first) : '/dashboard/unauthorized'} replace />;
}
