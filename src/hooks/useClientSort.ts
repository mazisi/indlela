import { useState } from 'react';
import type { Sort } from '@/types/sort';

/** A row's value to sort on: text, a number, or null (none: last either way). */
export type SortValue = string | number | null | undefined;

/**
 * Column sort for a table whose rows are all in the browser already (a
 * drawer's detail, a year's twelve months), so sorting needs no request:
 * the same clicks as `useUrlSort` (ascending, descending, back to the
 * table's own order) with `SortableHead`. Rows without the value go last
 * both ways; ties keep the table's own order.
 */
export function useClientSort<T, K extends string>(rows: readonly T[], values: Record<K, (row: T) => SortValue>) {
  const [sort, setSort] = useState<Sort<K> | undefined>(undefined);

  const onSort = (key: K) =>
    setSort((s) => (s?.key !== key ? { key, direction: 'asc' } : s.direction === 'asc' ? { key, direction: 'desc' } : undefined));

  if (!sort) return { rows: [...rows], sort, onSort };
  const value = values[sort.key];
  const down = sort.direction === 'desc' ? -1 : 1;
  const sorted = rows
    .map((row, i) => ({ row, i, v: value(row) }))
    .sort((a, b) => {
      const an = a.v === null || a.v === undefined || a.v === '';
      const bn = b.v === null || b.v === undefined || b.v === '';
      if (an || bn) return an === bn ? a.i - b.i : an ? 1 : -1;
      const c = typeof a.v === 'number' && typeof b.v === 'number' ? a.v - b.v : String(a.v).localeCompare(String(b.v), 'en', { numeric: true, sensitivity: 'base' });
      return c === 0 ? a.i - b.i : c * down;
    })
    .map((x) => x.row);
  return { rows: sorted, sort, onSort };
}
