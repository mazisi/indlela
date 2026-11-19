export type SortDirection = 'asc' | 'desc';

/** A server-side sort on one column; absent means the list's default order. */
export interface Sort<K extends string> {
  key: K;
  direction: SortDirection;
}
