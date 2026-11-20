import type { ResourcePage } from '@/types/pagination';
import type { Sort } from '@/types/sort';

/** The workspace's Google account (GET /google/connection), after the camelCase transform. */
export interface GoogleConnection {
  id: number;
  googleEmail: string;
  status: 'active' | 'error' | 'revoked';
  lastError: string | null;
  connectedBy: { id: number; name: string } | null;
  connectedAt: string | null;
}

/** A Search Console property the connected Google account can read. */
export interface GscProperty {
  siteUrl: string;
  /** e.g. siteOwner, siteFullUser, siteRestrictedUser */
  permissionLevel: string;
}

export type GscSyncStatus = 'idle' | 'queued' | 'syncing' | 'done' | 'failed';

/** A site with its Search Console link and sync state (GET /search-console/sites). */
export interface GscSite {
  id: number;
  name: string;
  url: string;
  /** Present on GET /search-console/sites (loaded there); may be absent on a single site returned by a mutation. */
  client?: { id: number; name: string } | null;
  /** The linked property, e.g. `sc-domain:example.co.za`; null when not linked. */
  gscProperty: string | null;
  gscSyncStatus: GscSyncStatus;
  gscSyncedAt: string | null;
  /** Last day with data (Y-m-d); null until the first import lands. */
  gscDataThrough: string | null;
  gscSyncError: string | null;
}

export type CompareMode = 'previous' | 'year' | 'none';

export interface Period {
  start: string;
  end: string;
}

/** Overview figures: position is null for a period (or day) without impressions. */
export interface Totals {
  clicks: number;
  impressions: number;
  /** 0–1 fraction. */
  ctr: number;
  position: number | null;
}

/** A report row's figures (rows always have impressions, so a position). */
interface RowMetrics {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SeriesPoint extends Totals {
  date: string;
}

export interface Overview {
  period: Period;
  comparePeriod: Period | null;
  dataThrough: string | null;
  totals: Totals;
  compareTotals: Totals | null;
  series: SeriesPoint[];
  compareSeries: SeriesPoint[] | null;
}

/** What every report request carries. */
export interface ReportScope {
  siteId: number;
  start?: string;
  end?: string;
  compare: CompareMode;
  /** Part of the query key only: a finished sync refetches every report. */
  syncedAt?: string | null;
}

/** Sortable columns per report (SearchConsoleReports::SORTS), sent as `sort=-col`; default is the first, descending. */
export const REPORT_SORT_KEYS = {
  queries: ['clicks', 'impressions', 'ctr', 'position', 'clicks_change', 'position_change'],
  pages: ['clicks', 'impressions', 'ctr', 'position', 'clicks_change', 'position_change'],
  'quick-wins': ['potential_clicks', 'impressions', 'clicks', 'ctr', 'position'],
  'low-ctr': ['missed_clicks', 'impressions', 'clicks', 'ctr', 'expected_ctr', 'position'],
  'content-decay': ['clicks_lost', 'clicks_last_28', 'clicks_prev_28', 'clicks_change_pct', 'decline_months'],
} as const;

export interface ReportQuery extends ReportScope {
  page: number;
  perPage: number;
  search?: string;
  sort?: Sort<string>;
}

/** Rows carry a synthetic `id` (position in the result) for the shared DataTable. */
interface Row {
  id: number;
}

export interface QueryRow extends Row, RowMetrics {
  query: string;
  clicksChange: number | null;
  positionChange: number | null;
}

export interface PageRow extends Row, RowMetrics {
  page: string;
  clicksChange: number | null;
  positionChange: number | null;
}

export interface QuickWinRow extends Row, RowMetrics {
  query: string;
  page: string;
  potentialClicks: number;
}

export interface LowCtrRow extends Row, RowMetrics {
  page: string;
  expectedCtr: number;
  missedClicks: number;
  topQueries: string[];
}

export interface MonthlyClicks {
  /** Y-m (or Y-m-d, first of the month). */
  month: string;
  clicks: number;
}

export interface DecayRow extends Row {
  page: string;
  clicksLast28: number;
  clicksPrev28: number;
  /** Percent, e.g. -34.5 for a 34.5 % drop. */
  clicksChangePct: number | null;
  monthly: MonthlyClicks[];
  declineMonths: number;
}

export interface ReportRows {
  queries: QueryRow;
  pages: PageRow;
  'quick-wins': QuickWinRow;
  'low-ctr': LowCtrRow;
  'content-decay': DecayRow;
}

export type ReportKey = keyof ReportRows;

export type ReportPage<K extends ReportKey> = ResourcePage<ReportRows[K]>;
