import type { PublicReport, ReportDetail, ReportPage, ReportRow, ReportSchedule, ReportSite, ReportSnapshot } from '../types';

export const row = (over: Partial<ReportRow> = {}): ReportRow => ({
  id: 41,
  title: 'SEO report · October 2026',
  periodStart: '2026-10-01',
  periodEnd: '2026-10-31',
  periodLabel: 'October 2026',
  status: 'ready',
  error: null,
  summary: ['Traffic up 14%', '6 keywords entered the top 10', '2 issues need attention'],
  sections: ['search_console', 'rank_tracking', 'site_audit'],
  trigger: 'manual',
  generatedBy: { id: 3, name: 'Nomsa Dlamini' },
  createdAt: '2026-11-02T08:15:00+02:00',
  sentAt: null,
  sentTo: null,
  share: null,
  ...over,
});

export const schedule = (over: Partial<ReportSchedule> = {}): ReportSchedule => ({
  siteId: 7,
  isActive: true,
  dayOfMonth: 1,
  sendHour: 8,
  recipients: ['thandi@karoocoffee.co.za', 'ops@karoocoffee.co.za'],
  sections: ['search_console', 'rank_tracking', 'site_audit'],
  compare: 'previous',
  note: null,
  lastRunAt: '2026-11-01T06:00:00+02:00',
  nextRunOn: '2026-12-01',
  nextRunAt: '2026-12-01T08:00:00+02:00',
  ...over,
});

export const site = (over: Partial<ReportSite> = {}): ReportSite => ({
  id: 7,
  name: 'Karoo Coffee',
  url: 'https://karoocoffee.co.za',
  client: { id: 1, name: 'Karoo Coffee (Pty) Ltd' },
  lastReport: row(),
  schedule: schedule(),
  ...over,
});

export const page = (rows: ReportRow[]): ReportPage => ({
  data: rows,
  meta: { currentPage: 1, lastPage: 1, perPage: 15, total: rows.length, from: rows.length ? 1 : null, to: rows.length || null },
});

export const snapshot = (over: Partial<ReportSnapshot> = {}): ReportSnapshot => ({
  client: { name: 'Karoo Coffee (Pty) Ltd' },
  site: { name: 'Karoo Coffee', url: 'https://karoocoffee.co.za' },
  period: { start: '2026-10-01', end: '2026-10-31', label: 'October 2026' },
  comparePeriod: { start: '2026-09-01', end: '2026-09-30', label: 'September 2026' },
  sections: ['search_console', 'rank_tracking', 'site_audit'],
  searchConsole: {
    available: true,
    totals: { clicks: 1140, impressions: 52000, ctr: 0.0219, position: 11.2 },
    compareTotals: { clicks: 1000, impressions: 48000, ctr: 0.0208, position: 12.4 },
    changes: { clicksPct: 14, impressionsPct: 8.3, ctr: 0.11, position: 1.2 },
    dataThrough: '2026-10-31',
    series: [
      { date: '2026-10-01', clicks: 30, impressions: 1500 },
      { date: '2026-10-02', clicks: 42, impressions: 1700 },
    ],
    topQueries: [{ query: 'coffee beans johannesburg', clicks: 210, impressions: 4100, position: 4.2 }],
    topPages: [{ page: 'https://karoocoffee.co.za/shop/beans', clicks: 320, impressions: 9000, position: 6.1 }],
    quickWins: [{ query: 'single origin coffee', page: 'https://karoocoffee.co.za/origins', position: 11.4, impressions: 2400, potentialClicks: 85 }],
  },
  rankTracking: {
    available: true,
    keywordsTracked: 24,
    avgPosition: 8.4,
    avgPositionChange: 1.6,
    distribution: { top3: 5, top10: 9, top20: 4, top100: 3, notRanking: 3 },
    distributionStart: { top3: 3, top10: 5, top20: 6, top100: 5, notRanking: 5 },
    enteredTop10: { count: 6, keywords: ['coffee subscription', 'espresso beans'] },
    leftTop10: { count: 0, keywords: [] },
    enteredTop3: { count: 2, keywords: ['karoo coffee'] },
    gains: [{ keyword: 'coffee subscription', locationName: 'Johannesburg', device: 'mobile', from: 14, to: 6, change: 8 }],
    drops: [{ keyword: 'decaf coffee', locationName: 'South Africa', device: 'desktop', from: 7, to: 12, change: -5 }],
    serpFeatures: { featuredSnippet: { present: 4, ours: 1 }, localPack: { present: 9, ours: 4 }, aiOverview: { present: 0, ours: 0 } },
  },
  siteAudit: {
    available: true,
    auditedOn: '2026-10-28',
    healthScore: 82,
    healthChange: 4,
    counts: { critical: 2, warning: 11, notice: 20, total: 33 },
    fixed: 12,
    new: 3,
    topIssues: [{ title: 'Broken internal links', severity: 'critical', count: 4, howToFix: 'Update or remove the links that point to missing pages.' }],
  },
  ...over,
});

export const detail = (over: Partial<ReportDetail> = {}): ReportDetail => ({
  ...row(),
  note: 'Great month: the new service pages are already ranking.',
  data: snapshot(),
  branding: { name: 'Sandton Digital', logoUrl: 'https://cdn.example/logo.png', brandColor: '#0b6e4f' },
  ...over,
});

export const publicReport = (over: Partial<PublicReport> = {}): PublicReport => ({
  title: 'SEO report · October 2026',
  periodLabel: 'October 2026',
  summary: ['Traffic up 14%', '6 keywords entered the top 10', '2 issues need attention'],
  note: 'Great month: the new service pages are already ranking.',
  data: snapshot(),
  branding: { name: 'Sandton Digital', logoUrl: 'https://cdn.example/logo.png', brandColor: '#0b6e4f' },
  generatedAt: '2026-11-02T08:15:00+02:00',
  ...over,
});
