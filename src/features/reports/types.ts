import type { ResourcePage } from '@/types/pagination';
import type { Severity } from '@/features/site-audit/types';

/* All shapes are after the client's snake_case → camelCase transform. */

export type ReportSection = 'search_console' | 'rank_tracking' | 'site_audit';
export type ReportStatus = 'generating' | 'ready' | 'failed';
export type ReportPeriod = 'last_month' | 'this_month' | 'last_3_months' | 'custom';
export type ReportCompare = 'previous' | 'year' | 'none';
export type ShareExpiry = 7 | 30 | 90 | null;

export interface ReportShare {
  /** The client-facing link (the SPA's /r/{token}). */
  url: string;
  expiresAt: string | null;
}

/** A report as listed (ReportResource). */
export interface ReportRow {
  id: number;
  siteId?: number;
  title: string;
  periodStart: string;
  periodEnd: string;
  /** e.g. "October 2026". */
  periodLabel: string;
  status: ReportStatus;
  error: string | null;
  /** Plain-language bullets: "Traffic up 14%", "6 keywords entered the top 10". */
  summary: string[];
  sections: ReportSection[];
  compare?: ReportCompare | null;
  note?: string | null;
  trigger: 'manual' | 'scheduled';
  generatedBy: { id: number; name: string } | null;
  createdAt: string;
  sentAt: string | null;
  sentTo: string[] | null;
  share: ReportShare | null;
}

export type ReportPage = ResourcePage<ReportRow>;

export interface ReportSchedule {
  siteId: number;
  isActive: boolean;
  /** 1–28. */
  dayOfMonth: number;
  /** 0–23, South African time. */
  sendHour: number;
  recipients: string[];
  sections: ReportSection[];
  compare: ReportCompare;
  note: string | null;
  lastRunAt: string | null;
  /** Y-m-d. */
  nextRunOn: string | null;
  /** ISO date-time (SAST) of the next run. */
  nextRunAt: string | null;
}

/** GET /reports/sites. */
export interface ReportSite {
  id: number;
  name: string;
  url: string;
  client: { id: number; name: string } | null;
  lastReport: ReportRow | null;
  schedule: ReportSchedule | null;
}

/** The agency's look on a report and its share page. */
export interface ReportBranding {
  name: string;
  logoUrl: string | null;
  /** #rrggbb; null for the default. */
  brandColor: string | null;
}

/* ---- Snapshot (the figures frozen when the report was generated) ---- */

interface Availability {
  available: boolean;
  /** Why a section has no figures, in plain words. */
  reason?: string | null;
}

export interface ScTotals {
  clicks: number;
  impressions: number;
  /** 0–1. */
  ctr: number;
  /** null without impressions. */
  position: number | null;
}

export interface SearchConsoleSnapshot extends Availability {
  totals?: ScTotals;
  compareTotals?: ScTotals | null;
  /** The API's own changes (the tiles compute theirs from the totals, like the app's KPI tiles). */
  changes?: { clicksPct: number | null; impressionsPct: number | null; ctr: number | null; position: number | null } | null;
  /** Y-m-d: Google's data runs to here. */
  dataThrough?: string | null;
  series?: { date: string; clicks: number; impressions: number }[];
  topQueries?: { query: string; clicks: number; impressions: number; position: number }[];
  topPages?: { page: string; clicks: number; impressions: number; position: number }[];
  quickWins?: { query: string; page: string; position: number; impressions: number; potentialClicks: number }[];
}

export interface RankDistribution {
  top3: number;
  top10: number;
  top20: number;
  top100: number;
  notRanking: number;
}

export interface KeywordGroup {
  count: number;
  keywords: string[];
}

export interface RankMove {
  keyword: string;
  locationName?: string;
  device?: 'desktop' | 'mobile';
  from: number | null;
  to: number | null;
  change: number | null;
}

export interface RankTrackingSnapshot extends Availability {
  keywordsTracked?: number;
  keywordsChecked?: number;
  avgPosition?: number | null;
  avgPositionStart?: number | null;
  /** Positive = moved up the rankings (improved). */
  avgPositionChange?: number | null;
  distribution?: RankDistribution;
  distributionStart?: RankDistribution | null;
  enteredTop10?: KeywordGroup;
  leftTop10?: KeywordGroup;
  enteredTop3?: KeywordGroup;
  leftTop3?: KeywordGroup;
  gains?: RankMove[];
  drops?: RankMove[];
  /** Keywords where each feature showed, and where the site is in it. */
  serpFeatures?: Partial<Record<'featuredSnippet' | 'localPack' | 'aiOverview', { present: number; ours: number }>>;
}

export interface SiteAuditSnapshot extends Availability {
  /** Y-m-d of the audit the figures come from. */
  auditedOn?: string | null;
  pagesCrawled?: number;
  healthScore?: number | null;
  previousHealthScore?: number | null;
  healthChange?: number | null;
  counts?: { critical: number; warning: number; notice: number; total?: number };
  fixed?: number | null;
  new?: number | null;
  topIssues?: { title: string; severity: Severity; count: number; howToFix: string | null }[];
}

export interface PeriodRef {
  start: string;
  end: string;
  label: string;
}

export interface ReportSnapshot {
  client?: { name: string } | null;
  site?: { name: string; url: string } | null;
  period?: PeriodRef | null;
  comparePeriod?: PeriodRef | null;
  /** The sections the report includes, in order. */
  sections?: ReportSection[];
  searchConsole?: SearchConsoleSnapshot | null;
  rankTracking?: RankTrackingSnapshot | null;
  siteAudit?: SiteAuditSnapshot | null;
}

/** GET /reports/{id}: the row with its figures and branding. */
export interface ReportDetail extends ReportRow {
  note: string | null;
  data: ReportSnapshot | null;
  branding: ReportBranding;
}

/** GET /public/reports/{token}. */
export interface PublicReport {
  title: string;
  /** null on very old snapshots: fall back to data.period.label. */
  periodLabel: string | null;
  summary: string[];
  note: string | null;
  data: ReportSnapshot;
  branding: ReportBranding;
  generatedAt: string | null;
}

/* ---- Writes ---- */

export interface GenerateReportInput {
  period: ReportPeriod;
  start?: string;
  end?: string;
  compare: ReportCompare;
  sections: ReportSection[];
  note?: string;
  title?: string;
  sendTo?: string[];
}

export interface ScheduleInput {
  isActive: boolean;
  dayOfMonth: number;
  sendHour: number;
  recipients: string[];
  sections: ReportSection[];
  compare: ReportCompare;
  note: string | null;
}

/** The list's bulk bar: delete the reports, or revoke their share links. */
export type ReportBulkAction = 'delete' | 'unshare';

export interface SendReportInput {
  recipients: string[];
  message?: string;
}
