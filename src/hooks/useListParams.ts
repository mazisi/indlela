import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { DEFAULT_PER_PAGE } from '@/types/pagination';

/**
 * A list page's URL state: `page`, `perPage` and a debounced `search` (the
 * input updates at once; the URL, and so the query, 350 ms after typing
 * stops, back on page 1). `update` merges changes into the URL.
 */
export function useListParams() {
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page')) || 1;
  const perPage = Number(params.get('perPage')) || DEFAULT_PER_PAGE;
  const [searchInput, setSearchInput] = useState(params.get('search') ?? '');
  const debounced = useDebouncedValue(searchInput.trim(), 350);

  const update = (changes: Record<string, string | number | undefined>) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(changes).forEach(([k, v]) => (v === undefined || v === '' ? next.delete(k) : next.set(k, String(v))));
        return next;
      },
      { replace: true },
    );

  // Keep the URL in step with the debounced search, restarting at page 1.
  if (debounced !== (params.get('search') ?? '')) update({ search: debounced || undefined, page: undefined });

  return {
    params,
    page,
    perPage,
    search: params.get('search') ?? undefined,
    searchInput,
    setSearchInput,
    update,
    onPageChange: (p: number) => update({ page: p === 1 ? undefined : p }),
    onPerPageChange: (n: number) => update({ perPage: n === DEFAULT_PER_PAGE ? undefined : n, page: undefined }),
  };
}
