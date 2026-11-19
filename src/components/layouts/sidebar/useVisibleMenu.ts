import { useMemo } from 'react';
import { usePermissions } from '@/contexts/PermissionContextType';
import { MODULES, permissionFor, type ModuleDef, type SubItem } from '@/config/modules';

export interface VisibleModule {
  module: ModuleDef;
  items: SubItem[];
}

/**
 * The menu this user may open: modules with at least one page they can open,
 * and within them only those pages. "Add …" pages need create on their
 * register. A module whose pages are all hidden disappears.
 */
export function useVisibleMenu(): VisibleModule[] {
  const { permissions, hasPermission } = usePermissions();

  return useMemo(
    () =>
      MODULES.map((m) => ({
        module: m,
        items: (m.items ?? []).filter((i) => hasPermission(permissionFor(m, i))),
      })).filter(({ module: m, items }) => (m.items ? items.length > 0 : hasPermission(permissionFor(m)))),
    // hasPermission is derived from permissions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [permissions],
  );
}
