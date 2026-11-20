import type { ResourcePage } from '@/types/pagination';
import type { PlatformUsage, WorkspaceUsage } from '../types';

const MONTHS = ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11'];

export const platformUsage = (over: Partial<PlatformUsage> = {}): PlatformUsage => ({
  month: '2026-11',
  spend: { thisMonth: 31.2, pending: 0.4, cap: 50, capUsedPct: 62.4 },
  provider: { configured: true, sandbox: false, balance: 68.8 },
  limits: { workspaceKeywordLimit: 500, checkNowDailyLimit: 20 },
  totals: { workspaces: 5, activeWorkspaces: 3, keywordsTracked: 1240, checksThisMonth: 18_400, liveChecksThisMonth: 42 },
  series: MONTHS.map((month, i) => ({ month, cost: [0, 4.2, 12.5, 20.1, 28.75, 31.2][i], checks: [0, 7000, 9800, 14_000, 16_500, 18_400][i] })),
  ...over,
});

export const workspaceRow = (over: Partial<WorkspaceUsage> = {}): WorkspaceUsage => ({
  id: 4,
  name: 'Acme Digital',
  slug: 'acme-digital',
  owner: { name: 'Thandi Nkosi', email: 'thandi@acme.co.za' },
  createdAt: '2026-09-02T08:00:00+02:00',
  keywordsTracked: 420,
  keywordLimit: 500,
  keywordLimitOverride: null,
  sitesCount: 6,
  checksThisMonth: 9600,
  liveChecksThisMonth: 12,
  costThisMonth: 14.6,
  costLastMonth: 12.1,
  lastCheckAt: '2026-11-20T01:12:00+02:00',
  series: MONTHS.map((month, i) => ({ month, cost: [0, 1, 4, 8, 12.1, 14.6][i] })),
  ...over,
});

export const page = (rows: WorkspaceUsage[], total = rows.length): ResourcePage<WorkspaceUsage> => ({
  data: rows,
  meta: { currentPage: 1, lastPage: Math.max(1, Math.ceil(total / 15)), perPage: 15, total, from: rows.length ? 1 : null, to: rows.length || null },
});
