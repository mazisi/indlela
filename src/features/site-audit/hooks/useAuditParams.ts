import { useSearchParams } from 'react-router';

export type AuditTab = 'issues' | 'pages' | 'vitals' | 'history';

export const AUDIT_TABS: readonly { key: AuditTab; label: string }[] = [
  { key: 'issues', label: 'Issues' },
  { key: 'pages', label: 'Pages' },
  { key: 'vitals', label: 'Core Web Vitals' },
  { key: 'history', label: 'History' },
];

const DEFAULT_TAB: AuditTab = 'issues';

/** A tab's own list state, cleared for another tab or audit (the Pages tab's filters too). */
const LIST_KEYS = ['page', 'perPage', 'search', 'sort', 'direction', 'status', 'indexable'];

/**
 * The site audit page's URL state: `audit` (absent = the latest finished
 * audit) and `tab` (absent = Issues). The Pages and History tables keep their
 * page, search, sort and filters alongside.
 */
export function useAuditParams() {
  const [params, setParams] = useSearchParams();
  const auditId = Number(params.get('audit')) || undefined;
  const tab = AUDIT_TABS.find((t) => t.key === params.get('tab'))?.key ?? DEFAULT_TAB;

  const set = (changes: Record<string, string | undefined>) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        LIST_KEYS.forEach((k) => next.delete(k));
        Object.entries(changes).forEach(([k, v]) => (v === undefined ? next.delete(k) : next.set(k, v)));
        return next;
      },
      { replace: true },
    );

  return {
    auditId,
    tab,
    setTab: (t: AuditTab) => set({ tab: t === DEFAULT_TAB ? undefined : t }),
    /** Opens an audit (undefined: back to the latest) on its Issues tab. */
    setAudit: (id: number | undefined) => set({ audit: id ? String(id) : undefined, tab: undefined }),
  };
}
