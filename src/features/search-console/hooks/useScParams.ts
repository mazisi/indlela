import { useSearchParams } from 'react-router';
import { DEFAULT_COMPARE, DEFAULT_RANGE, isCompareMode, isRangeKey, type RangeKey } from '../lib/dateRange';
import type { CompareMode, ReportKey } from '../types';

export const REPORT_TABS: readonly { key: ReportKey; label: string }[] = [
  { key: 'queries', label: 'Queries' },
  { key: 'pages', label: 'Pages' },
  { key: 'quick-wins', label: 'Quick wins' },
  { key: 'low-ctr', label: 'Low CTR' },
  { key: 'content-decay', label: 'Content decay' },
];

const DEFAULT_TAB: ReportKey = 'queries';

/**
 * A report's own list state: all of it is cleared for another site or tab
 * (the table remounts, so its search box starts empty too); a new range or
 * comparison only goes back to page 1, keeping the search and sort.
 */
const RESET = { all: ['page', 'perPage', 'search', 'sort', 'direction'], page: ['page'] } as const;

/**
 * The Search Console page's URL state: `site`, `range`, `compare` and `tab`
 * (defaults are left out of the URL). The report table's page, search and
 * sort live alongside (useListParams / useUrlSort).
 */
export function useScParams() {
  const [params, setParams] = useSearchParams();
  const siteId = Number(params.get('site')) || undefined;
  const rangeParam = params.get('range');
  const range: RangeKey = isRangeKey(rangeParam) ? rangeParam : DEFAULT_RANGE;
  const compareParam = params.get('compare');
  const compare: CompareMode = isCompareMode(compareParam) ? compareParam : DEFAULT_COMPARE;
  const tab = REPORT_TABS.find((t) => t.key === params.get('tab'))?.key ?? DEFAULT_TAB;

  const set = (changes: Record<string, string | undefined>, reset: keyof typeof RESET) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        RESET[reset].forEach((k) => next.delete(k));
        Object.entries(changes).forEach(([k, v]) => (v === undefined ? next.delete(k) : next.set(k, v)));
        return next;
      },
      { replace: true },
    );

  return {
    siteId,
    range,
    compare,
    tab,
    setSite: (id: number) => set({ site: String(id) }, 'all'),
    setRange: (r: RangeKey) => set({ range: r === DEFAULT_RANGE ? undefined : r }, 'page'),
    setCompare: (c: CompareMode) => set({ compare: c === DEFAULT_COMPARE ? undefined : c }, 'page'),
    setTab: (t: ReportKey) => set({ tab: t === DEFAULT_TAB ? undefined : t }, 'all'),
  };
}
