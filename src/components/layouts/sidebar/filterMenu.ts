import type { VisibleModule } from './useVisibleMenu';

/**
 * The menu narrowed to a search: a section whose name matches keeps all its
 * pages; otherwise it keeps only the pages whose names match, and drops out
 * when none do. Case-insensitive; a blank search returns the menu unchanged.
 */
export function filterMenu(menu: VisibleModule[], query: string): VisibleModule[] {
  const q = query.trim().toLowerCase();
  if (!q) return menu;
  const hit = (label: string) => label.toLowerCase().includes(q);

  return menu.flatMap(({ module, items }) => {
    if (hit(module.label)) return [{ module, items }];
    const matching = items.filter((i) => hit(i.label));
    return matching.length > 0 ? [{ module, items: matching }] : [];
  });
}
