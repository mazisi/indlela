import type { ResourcePage } from '@/types/pagination';
import type { Sort } from '@/types/sort';

export type Device = 'desktop' | 'mobile';
export type Frequency = 'daily' | 'weekly';
export type CheckStatus = 'pending' | 'done' | 'failed';
export type Bucket = 'top3' | 'top10' | 'top100' | 'not_ranking';

/** A site in the rank tracking overview (GET /rank-tracking/sites). */
export interface RankSite {
  id: number;
  name: string;
  url: string;
  client: { id: number; name: string } | null;
  keywordsCount: number;
  avgPosition: number | null;
  top3: number;
  top10: number;
  top100: number;
  /** Average change in position over 7 days; positive = moved up (improved). */
  change7dAvg: number | null;
  lastCheckedOn: string | null;
}

/** A searchable location (GET /rank-tracking/locations). */
export interface RankLocation {
  code: number;
  name: string;
  /** e.g. Country, City, Region. */
  type: string;
  countryIso: string | null;
}

/** The workspace's rank tracking allowance (GET /rank-tracking/usage). */
export interface RankUsage {
  /** Active keyword × location × device combinations tracked in the workspace. */
  keywordsTracked: number;
  keywordLimit: number;
  /** "Check now" runs used today. */
  checksNowToday: number;
  checkNowLimit: number;
  /** Checks are on hold platform-wide: Check now and location search answer 409 `rank_checks_paused`. */
  paused: boolean;
}

export type KeywordLocation =
  | { type: 'code'; code: number; coordinate?: null; name: string }
  | { type: 'coordinate'; code?: null; coordinate: string; name: string };

/** One SERP feature on a check: whether it showed, and whether the site appeared in it. */
export interface SerpFeature {
  present: boolean;
  ours?: boolean;
}

export type SerpFeatureKey = 'featuredSnippet' | 'localPack' | 'aiOverview';

/** Other features the API may add are ignored. */
export type SerpFeatures = Partial<Record<SerpFeatureKey | 'peopleAlsoAsk', SerpFeature>>;

export interface HistoryPoint {
  date: string;
  /** null: not in the top 100 that day. */
  position: number | null;
}

/** A tracked keyword (GET /sites/{site}/rank-keywords), after the key tidy-up (change_7d → change7d). */
export interface RankKeyword {
  id: number;
  keyword: string;
  location: KeywordLocation;
  languageCode: string;
  device: Device;
  frequency: Frequency;
  /** Day of the week for weekly checks: 0 = Sunday … 6 = Saturday. */
  weeklyDay: number | null;
  tags: string[];
  isActive: boolean;
  /** A "key keyword": competitor overtake alerts fire only for these. */
  isKey: boolean;
  /** null: not in the top 100 (or not checked yet). */
  position: number | null;
  previousPosition: number | null;
  /** Positive = moved up (improved). */
  change1d: number | null;
  change7d: number | null;
  change30d: number | null;
  bestPosition: number | null;
  /** The site's URL that ranks. */
  url: string | null;
  urlChanged: boolean;
  /** Two or more of the site's URLs rank for this keyword. */
  cannibalised: boolean;
  serpFeatures: SerpFeatures | null;
  lastCheckedOn: string | null;
  lastCheckStatus: CheckStatus | null;
  /** The last checks, oldest first. */
  history: HistoryPoint[];
}

export const KEYWORD_SORT_KEYS = ['keyword', 'position', 'change_7d', 'change_30d', 'best_position'] as const;
export type KeywordSortKey = (typeof KEYWORD_SORT_KEYS)[number];

export interface KeywordQuery {
  page: number;
  perPage: number;
  search?: string;
  device?: Device;
  location?: string;
  tag?: string;
  bucket?: Bucket;
  /** Key keywords only. */
  isKey?: boolean;
  sort?: Sort<KeywordSortKey>;
}

export type KeywordPage = ResourcePage<RankKeyword>;

export interface NewKeywordLocation {
  type: 'code' | 'coordinate';
  code?: number;
  coordinate?: string;
  name: string;
}

export interface AddKeywordsInput {
  keywords: string[];
  locations: NewKeywordLocation[];
  devices: Device[];
  frequency: Frequency;
  languageCode?: string;
  tags?: string[];
}

export interface AddKeywordsResult {
  created: number;
  skipped: number;
}

/** Sent fields only; `weeklyDay` only with weekly checks (the API takes 0–6, never null). */
export interface KeywordUpdate {
  frequency: Frequency;
  weeklyDay?: number;
  tags: string[];
  isActive: boolean;
  isKey?: boolean;
}

export type BulkAction = 'activate' | 'deactivate' | 'delete' | 'set_frequency' | 'mark_key' | 'unmark_key';

export interface KeywordHistoryPoint extends HistoryPoint {
  url: string | null;
  serpFeatures: SerpFeatures | null;
}

export interface Distribution {
  top3: number;
  /** Positions 4–10. */
  top10: number;
  /** Positions 11–20. */
  top20: number;
  /** Positions 21–100. */
  top100: number;
  notRanking: number;
}

export interface VisibilityPoint {
  date: string;
  /** 0–100; null on a day no keyword had a result yet. */
  visibility: number | null;
  avgPosition: number | null;
}

export interface Mover {
  keywordId: number;
  keyword: string;
  locationName: string;
  device: Device;
  from: number | null;
  to: number | null;
  /** Positive = moved up. */
  change: number;
}

export interface RankSummary {
  keywordsCount: number;
  avgPosition: number | null;
  distribution: Distribution;
  distribution7dAgo: Distribution | null;
  /** 0–100. */
  visibility: number;
  visibilitySeries: VisibilityPoint[];
  gains: Mover[];
  drops: Mover[];
  serpFeatures: Record<SerpFeatureKey, { present: number; ours: number }>;
  cannibalisedCount: number;
  /** Filter options, when the API sends them. */
  locations?: string[];
  tags?: string[];
}

export interface CannibalisedRow {
  id: number;
  keywordId: number;
  keyword: string;
  locationName: string;
  device: Device;
  urls: { url: string; position: number }[];
}

/* ---- Competitor tracking ---- */

/** A domain's standing on the site's active keywords' latest checks. */
export interface CompetitorStats {
  /** Keywords where it holds positions 1–10. */
  top10: number;
  top3: number;
  /** Keywords where it's in the top 100. */
  ranked: number;
  /** Over the keywords where it's in the top 100; null when it's in none. */
  avgPosition: number | null;
  /** Share of voice, 0–100: its top-10 appearances over everyone's (site + active competitors). */
  sov: number;
}

/** GET /sites/{site}/competitors. */
export interface Competitor {
  id: number;
  /** Bare host, e.g. beanthere.co.za. */
  domain: string;
  /** Label; the domain unless renamed. */
  name: string;
  isActive: boolean;
  createdAt: string;
  /** null until a check has seen it (or while paused). */
  latest: CompetitorStats | null;
  /** Positions have been recorded for it (backfilled or from a check since it was added). */
  hasHistory: boolean;
}

/** GET /sites/{site}/competitors/suggestions: hosts seen most in the site's top 10s. */
export interface CompetitorSuggestion {
  domain: string;
  /** Keywords where it's in the top 10. */
  top10Keywords: number;
  /** Keywords where it's in the top 100. */
  keywordsSeen: number;
  bestPosition: number | null;
}

export interface CompetitorInput {
  domain: string;
  name?: string;
}

export interface CompetitorUpdate {
  name?: string;
  isActive?: boolean;
}

export interface SovWeek {
  /** Monday of the ISO week, Y-m-d. */
  weekStart: string;
  /** The site's share of voice that week (0–100); null before competitor history starts (no point drawn). */
  site: number | null;
  /** Each active competitor's share, by competitor id. */
  competitors: Record<string, number>;
}

/** GET /sites/{site}/competitors/overview. */
export interface CompetitorOverview {
  site: CompetitorStats & { domain: string };
  /** Active competitors. */
  competitors: (CompetitorStats & { id: number; name: string; domain: string })[];
  /** The last 12 ISO weeks, oldest first. */
  trend: SovWeek[];
  keywordsTotal: number;
  keyKeywords: number;
  /** The first check that recorded competitors' positions; null when none has yet. */
  historySince: string | null;
}

/** A position on the latest check and its change since the previous one (positive = moved up). */
export interface H2HPosition {
  position: number | null;
  change: number | null;
}

/** One keyword in the head-to-head (GET /sites/{site}/competitors/keywords). */
export interface HeadToHeadRow {
  /** The keyword's id, for the table. */
  id: number;
  keywordId: number;
  keyword: string;
  locationName: string;
  device: Device;
  isKey: boolean;
  ours: H2HPosition;
  competitors: (H2HPosition & { id: number })[];
  bestCompetitorPosition: number | null;
  /** Best competitor position − ours: positive = the site is ahead. */
  gap: number | null;
}

export const H2H_SORT_KEYS = ['keyword', 'position', 'gap'] as const;
export type H2HSortKey = (typeof H2H_SORT_KEYS)[number];
export type H2HOnly = 'losing' | 'winning' | 'key';

export interface H2HQuery {
  page: number;
  perPage: number;
  search?: string;
  only?: H2HOnly;
  sort?: Sort<H2HSortKey>;
}

/** GET /sites/{site}/competitor-alerts: a competitor overtook the site on a key keyword. */
export interface CompetitorAlert {
  id: number;
  checkedOn: string;
  keyword: { id: number; keyword: string; locationName: string; device: Device };
  competitor: { id: number; name: string; domain: string };
  ourPosition: number | null;
  theirPosition: number | null;
  previousOurPosition: number | null;
  previousTheirPosition: number | null;
  emailedAt: string | null;
}

/** GET|PUT /sites/{site}/competitor-settings. */
export interface CompetitorSettings {
  alertRecipients: string[];
}
