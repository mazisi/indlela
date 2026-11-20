import type { ResourcePage } from '@/types/pagination';

/* All shapes are after the client's snake_case → camelCase transform. */

export type AuditStatus = 'queued' | 'crawling' | 'analysing' | 'done' | 'failed' | 'cancelled';
export type AuditSchedule = 'off' | 'weekly' | 'monthly';
export type Severity = 'critical' | 'warning' | 'notice';
export type VitalsStatus = 'pending' | 'done' | 'unavailable';

export interface SeverityCounts {
  critical: number;
  warning: number;
  notice: number;
  total: number;
}

/** Against the audit before it: issues (type + URL) gone, appeared and still there. */
export interface AuditComparison {
  fixed: number;
  new: number;
  persisting: number;
  previousAuditId: number;
}

/** One crawl (AuditSummary). */
export interface Audit {
  id: number;
  siteId: number;
  status: AuditStatus;
  trigger: 'manual' | 'scheduled';
  triggeredBy: { id: number; name: string } | null;
  pageLimit: number;
  pagesCrawled: number;
  pagesFound: number;
  startedAt: string | null;
  finishedAt: string | null;
  error: string | null;
  /** 0–100; null until the audit is done. */
  healthScore: number | null;
  counts: SeverityCounts;
  /** null on the first audit of a site (nothing to compare with). */
  comparison: AuditComparison | null;
  vitalsStatus: VitalsStatus;
  vitalsMessage: string | null;
  /** Older audits keep only this summary: their pages and issues are pruned. */
  detailsPruned?: boolean;
}

/** A site with its audit settings and audits (GET /site-audit/sites). */
export interface AuditSite {
  id: number;
  name: string;
  url: string;
  client: { id: number; name: string } | null;
  auditSchedule: AuditSchedule;
  auditPageLimit: number;
  /** The most recent done audit (a later failed or cancelled one shows only in the history). */
  latestAudit: Audit | null;
  runningAudit: Audit | null;
}

export interface AuditSettings {
  auditSchedule: AuditSchedule;
  auditPageLimit: number;
}

/** An issue type found in an audit (GET /audits/{audit}/issues). */
export interface IssueGroup {
  type: string;
  severity: Severity;
  title: string;
  /** Plain English: why it matters. */
  why: string;
  howToFix: string;
  /** Affected URLs. */
  count: number;
  /** Of which not in the previous audit. */
  newCount: number;
}

/** Details vary by issue type; keys arrive camelCased. */
export type IssueDetails = Record<string, unknown>;

export interface AffectedUrl {
  url: string;
  pageId: number | null;
  details: IssueDetails | null;
  isNew: boolean;
}

export type StatusClass = '2xx' | '3xx' | '4xx' | '5xx';

export const PAGE_SORT_KEYS = ['url', 'status_code', 'response_ms', 'inlinks_count', 'word_count', 'depth'] as const;
export type PageSortKey = (typeof PAGE_SORT_KEYS)[number];

export interface CrawledPage {
  id: number;
  url: string;
  depth: number;
  statusCode: number | null;
  finalUrl: string | null;
  finalStatusCode?: number | null;
  contentType: string | null;
  responseMs: number | null;
  title: string | null;
  metaDescription: string | null;
  h1: string | null;
  h1Count: number;
  canonical: string | null;
  metaRobots: string | null;
  isIndexable: boolean;
  inSitemap: boolean;
  inlinksCount: number;
  outlinksCount: number;
  wordCount: number | null;
  imagesCount: number;
  imagesMissingAlt: number;
  issuesCount: number;
}

export interface PageIssue {
  type: string;
  severity: Severity;
  title: string;
  details: IssueDetails | null;
  isNew?: boolean;
}

export interface RedirectHop {
  url: string;
  statusCode: number | null;
}

/** GET /audits/{audit}/pages/{page}: the list row plus the detail-only fields, its issues and (the first 50) inlinks. */
export interface CrawledPageDetail extends CrawledPage {
  redirectChain: RedirectHop[] | null;
  xRobotsTag: string | null;
  canonicalCount?: number;
  fetchError?: string | null;
  missingAltImages?: string[];
  issues: PageIssue[];
  inlinks: { pageId?: number; url: string; nofollow?: boolean }[];
  inlinksTotal?: number;
}

export interface PagesQuery {
  page: number;
  perPage: number;
  search?: string;
  status?: StatusClass;
  indexable?: boolean;
  /** `-word_count` style. */
  sort?: string;
}

export type Strategy = 'mobile' | 'desktop';
export type VitalCategory = 'good' | 'needs-improvement' | 'poor';

/**
 * CrUX real-user data (p75) as the API stores it: flat, CLS already divided
 * by 100, categories good / needs_improvement / poor. `originFallback`: too
 * few visits to the page, so the figures are the whole site's.
 */
export interface FieldData {
  lcpMs: number | null;
  lcpCategory?: string | null;
  inpMs: number | null;
  inpCategory?: string | null;
  cls: number | null;
  clsCategory?: string | null;
  category?: string | null;
  originFallback?: boolean;
}

export interface VitalsRow {
  url: string;
  strategy: Strategy;
  performanceScore: number | null;
  lab: { lcpMs: number | null; cls: number | null; tbtMs: number | null; fcpMs: number | null; siMs: number | null } | null;
  field: FieldData | null;
  status: string;
  error: string | null;
}

export type ChangeFilter = 'fixed' | 'new';

export interface ComparisonRow {
  type: string;
  severity: Severity;
  title: string;
  url: string;
  details?: IssueDetails | null;
}

export interface ListQuery {
  page: number;
  perPage: number;
  search?: string;
}

export type Paged<T> = ResourcePage<T>;
