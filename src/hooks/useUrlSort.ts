import { useSearchParams } from 'react-router';
import type { Sort } from '@/types/sort';

/**
 * Column sort kept in the URL (`sort`, `direction`), for server-side sorted
 * lists. Clicking a column sorts ascending, then descending, then back to
 * the list's default order; any change returns to page 1.
 */
export function useUrlSort<K extends string>(keys: readonly K[]) {
  const [params, setParams] = useSearchParams();
  const key = params.get('sort') as K | null;
  const sort: Sort<K> | undefined =
    key && keys.includes(key) ? { key, direction: params.get('direction') === 'desc' ? 'desc' : 'asc' } : undefined;

  // Read the current state from `prev`, not this render, so quick double clicks still cycle.
  const onSort = (next: K) =>
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        p.delete('page');
        if (prev.get('sort') !== next) {
          p.set('sort', next);
          p.delete('direction');
        } else if (prev.get('direction') !== 'desc') {
          p.set('direction', 'desc');
        } else {
          p.delete('sort');
          p.delete('direction');
        }
        return p;
      },
      { replace: true },
    );

  return { sort, onSort };
}
