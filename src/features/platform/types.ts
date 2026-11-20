/**
 * Platform › Usage (Indlela staff only): the company's DataForSEO spend and
 * every workspace's rank-tracking usage. Amounts are US dollars, as
 * DataForSEO bills them. Shapes are after the client's camelCase transform.
 */

/** "2026-11": a calendar month. */
export type YearMonth = string;

export interface PlatformSpend {
  /** This month across every workspace: charged + pending (the figure the cap compares). */
  thisMonth: number;
  /** The expected price of checks posted and not answered yet. */
  pending: number;
  /** The monthly spend cap; 0 or null = no cap. */
  cap: number | null;
  /** Share of the cap used (0–100+, can pass 100), or null without a cap. */
  capUsedPct: number | null;
}

export interface PlatformProvider {
  /** DataForSEO credentials are set. */
  configured: boolean;
  /** Pointed at the sandbox (free sample data). */
  sandbox: boolean;
  /** The account's balance, or null when it couldn't be read. */
  balance: number | null;
}

export interface PlatformLimits {
  /** The default active keywords per workspace (500). */
  workspaceKeywordLimit: number;
  checkNowDailyLimit: number;
}

export interface PlatformTotals {
  workspaces: number;
  activeWorkspaces: number;
  keywordsTracked: number;
  checksThisMonth: number;
  liveChecksThisMonth: number;
}

export interface MonthCost {
  month: YearMonth;
  cost: number;
}

export interface MonthUsage extends MonthCost {
  checks: number;
}

export interface PlatformUsage {
  month: YearMonth;
  spend: PlatformSpend;
  provider: PlatformProvider;
  limits: PlatformLimits;
  totals: PlatformTotals;
  /** The last 6 months, oldest first, ending with this month; charged cost only (no pending). */
  series: MonthUsage[];
}

export interface WorkspaceUsage {
  id: number;
  name: string;
  slug: string;
  owner: { name: string; email: string } | null;
  createdAt: string;
  keywordsTracked: number;
  /** The limit in force: the override, else the default. */
  keywordLimit: number;
  /** Set when staff gave this workspace its own limit. */
  keywordLimitOverride: number | null;
  sitesCount: number;
  checksThisMonth: number;
  liveChecksThisMonth: number;
  costThisMonth: number;
  costLastMonth: number;
  lastCheckAt: string | null;
  /** The last 6 months, oldest first. */
  series: MonthCost[];
}

export const WORKSPACE_SORT_KEYS = ['name', 'keywords_tracked', 'checks_this_month', 'cost_this_month', 'cost_last_month', 'last_check_at'] as const;
export type WorkspaceSortKey = (typeof WORKSPACE_SORT_KEYS)[number];

export interface WorkspaceUsageQuery {
  page: number;
  perPage: number;
  search?: string;
  sort: { key: WorkspaceSortKey; direction: 'asc' | 'desc' };
}
