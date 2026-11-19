import type { Action } from '@/config/modules';
import type { CatalogResource } from '../types';

export const permissionName = (action: Action, resource: string) => `${action}_${resource}`;

/**
 * Tick or untick one action on a page. Every action needs View, so ticking
 * any action ticks View too, and unticking View clears the whole page.
 */
export function toggle(held: ReadonlySet<string>, resource: CatalogResource, action: Action, checked: boolean): Set<string> {
  const next = new Set(held);
  if (checked) {
    next.add(permissionName(action, resource.key));
    next.add(permissionName('view', resource.key));
  } else if (action === 'view') {
    resource.actions.forEach((a) => next.delete(permissionName(a, resource.key)));
  } else {
    next.delete(permissionName(action, resource.key));
  }
  return next;
}

export const sameSet = (a: ReadonlySet<string>, b: ReadonlySet<string>) => a.size === b.size && [...a].every((p) => b.has(p));

/** true / false / 'indeterminate' for a "select all" checkbox over some permission names. */
export function checkState(held: ReadonlySet<string>, names: string[]): boolean | 'indeterminate' {
  const n = names.filter((p) => held.has(p)).length;
  return n === 0 ? false : n === names.length ? true : 'indeterminate';
}
