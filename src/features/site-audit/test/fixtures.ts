import type { Audit, AuditSite, IssueGroup, VitalsRow } from '../types';

export function audit(over: Partial<Audit> = {}): Audit {
  return {
    id: 41,
    siteId: 7,
    status: 'done',
    trigger: 'manual',
    triggeredBy: { id: 1, name: 'Johan Pretorius' },
    pageLimit: 500,
    pagesCrawled: 312,
    pagesFound: 312,
    startedAt: '2026-11-19T08:00:00+02:00',
    finishedAt: '2026-11-19T08:12:00+02:00',
    error: null,
    healthScore: 82,
    counts: { critical: 3, warning: 14, notice: 35, total: 52 },
    comparison: { fixed: 12, new: 3, persisting: 49, previousAuditId: 40 },
    vitalsStatus: 'done',
    vitalsMessage: null,
    ...over,
  };
}

export const PREVIOUS = audit({ id: 40, finishedAt: '2026-11-14T09:30:00+02:00', startedAt: '2026-11-14T09:20:00+02:00', healthScore: 74, comparison: null });

export function site(over: Partial<AuditSite> = {}): AuditSite {
  return {
    id: 7,
    name: 'Karoo Coffee',
    url: 'https://www.karoocoffee.co.za',
    client: { id: 1, name: 'Karoo Coffee Co' },
    auditSchedule: 'weekly',
    auditPageLimit: 500,
    latestAudit: audit(),
    runningAudit: null,
    ...over,
  };
}

export function page<T>(data: T[], total = data.length) {
  return { data, meta: { currentPage: 1, lastPage: Math.ceil(total / 15) || 1, perPage: 15, total, from: 1, to: data.length } };
}

export const ISSUES: IssueGroup[] = [
  {
    type: 'redirect_chain',
    severity: 'warning',
    title: 'Redirect chains',
    why: 'Each extra hop slows visitors down and wastes Google’s crawl budget.',
    howToFix: 'Point links straight at the final address.',
    count: 4,
    newCount: 1,
  },
  {
    type: 'broken_link',
    severity: 'critical',
    title: 'Broken internal links',
    why: 'Visitors hit a dead end and Google stops following the link.',
    howToFix: 'Update or remove the link, or redirect the missing page.',
    count: 3,
    newCount: 0,
  },
  {
    type: 'missing_alt',
    severity: 'notice',
    title: 'Images without alt text',
    why: 'Screen readers and Google can’t tell what the image shows.',
    howToFix: 'Describe each image in its alt attribute.',
    count: 35,
    newCount: 2,
  },
];

export const VITALS: VitalsRow[] = [
  {
    url: 'https://www.karoocoffee.co.za/',
    strategy: 'mobile',
    performanceScore: 48,
    lab: { lcpMs: 4600, cls: 0.02, tbtMs: 350, fcpMs: 1800, siMs: 3900 },
    field: { lcpMs: 2500, lcpCategory: 'good', inpMs: 520, inpCategory: 'poor', cls: 0.1, clsCategory: 'good', category: 'poor', originFallback: false },
    status: 'done',
    error: null,
  },
  {
    url: 'https://www.karoocoffee.co.za/shop',
    strategy: 'mobile',
    performanceScore: 91,
    lab: { lcpMs: 4001, cls: 0.26, tbtMs: 150, fcpMs: 900, siMs: 1500 },
    field: null,
    status: 'done',
    error: null,
  },
  {
    url: 'https://www.karoocoffee.co.za/',
    strategy: 'desktop',
    performanceScore: 97,
    lab: { lcpMs: 1200, cls: 0, tbtMs: 10, fcpMs: 500, siMs: 800 },
    field: null,
    status: 'done',
    error: null,
  },
];
