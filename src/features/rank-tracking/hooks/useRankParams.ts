import { useSearchParams } from 'react-router';

export type RankTab = 'keywords' | 'cannibalisation';

export const RANK_TABS: readonly { key: RankTab; label: string }[] = [
  { key: 'keywords', label: 'Keywords' },
  { key: 'cannibalisation', label: 'Cannibalisation' },
];

const DEFAULT_TAB: RankTab = 'keywords';

/** A tab's own list state, cleared when the tab changes. */
const LIST_KEYS = ['page', 'perPage', 'search', 'sort', 'direction', 'device', 'location', 'tag', 'bucket'];

/** The site page's tab (`tab`, absent = Keywords); the Keywords table keeps its filters, sort and page alongside. */
export function useRankParams() {
  const [params, setParams] = useSearchParams();
  const tab = RANK_TABS.find((t) => t.key === params.get('tab'))?.key ?? DEFAULT_TAB;

  const setTab = (t: RankTab) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        LIST_KEYS.forEach((k) => next.delete(k));
        if (t === DEFAULT_TAB) next.delete('tab');
        else next.set('tab', t);
        return next;
      },
      { replace: true },
    );

  return { tab, setTab };
}
