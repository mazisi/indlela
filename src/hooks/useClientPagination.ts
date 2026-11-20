import { useSearchParams } from 'react-router';
import { DEFAULT_PER_PAGE } from '@/types/pagination';

export interface PageMeta {
  currentPage: number;
  lastPage: number;
  total: number;
  perPage: number;
}

/**
 * Pages a list the API returns whole (e.g. every site a user can access), so
 * it gets the same Paginator as a server-paginated table. `page` and
 * `perPage` live in the URL like useListParams; a page past the end (after a
 * search narrows the list) shows the last one.
 */
export function useClientPagination<T>(rows: T[]) {
  const [params, setParams] = useSearchParams();
  const perPage = Number(params.get('perPage')) || DEFAULT_PER_PAGE;
  const lastPage = Math.max(1, Math.ceil(rows.length / perPage));
  const currentPage = Math.min(Math.max(1, Number(params.get('page')) || 1), lastPage);

  const update = (changes: Record<string, number | undefined>) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(changes).forEach(([k, v]) => (v === undefined ? next.delete(k) : next.set(k, String(v))));
        return next;
      },
      { replace: true },
    );

  const meta: PageMeta = { currentPage, lastPage, total: rows.length, perPage };

  return {
    pageRows: rows.slice((currentPage - 1) * perPage, currentPage * perPage),
    meta,
    onPageChange: (p: number) => update({ page: p === 1 ? undefined : p }),
    onPerPageChange: (n: number) => update({ perPage: n === DEFAULT_PER_PAGE ? undefined : n, page: undefined }),
    /** Back to page 1, e.g. when a search changes. */
    reset: () => update({ page: undefined }),
  };
}
