import { useState } from 'react';

type Id = number | string;

/**
 * Checkbox selection for one page of a table. Selection is per page: pass a
 * `resetKey` built from the page, page size and filters, and the selection
 * empties itself when it changes, so bulk actions never touch rows the user
 * can't see.
 */
export function useRowSelection<T extends Id>(rowIds: T[], resetKey: string) {
  const [state, setState] = useState<{ key: string; ids: Set<T> }>({ key: resetKey, ids: new Set() });
  const selected = state.key === resetKey ? state.ids : new Set<T>();
  const set = (update: (prev: Set<T>) => Set<T>) => setState({ key: resetKey, ids: update(selected) });

  // Ignore ids that are no longer on the page (e.g. after a delete).
  const ids = rowIds.filter((id) => selected.has(id));
  const all = rowIds.length > 0 && ids.length === rowIds.length;

  return {
    ids,
    count: ids.length,
    isSelected: (id: T) => selected.has(id),
    toggle: (id: T) =>
      set((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
    /** For the header checkbox: true, false or 'indeterminate'. */
    headerState: (all ? true : ids.length > 0 ? 'indeterminate' : false) as boolean | 'indeterminate',
    toggleAll: (checked: boolean) => set(() => (checked ? new Set(rowIds) : new Set())),
    clear: () => set(() => new Set()),
  };
}

export type RowSelection<T extends Id> = ReturnType<typeof useRowSelection<T>>;
