/** Laravel resource-collection pagination, after the camelCase transform. */
export interface ResourcePage<T> {
  data: T[];
  meta: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
    from: number | null;
    to: number | null;
  };
}

/** Paginated lists default to 15 per page across the system. */
export const DEFAULT_PER_PAGE = 15;
