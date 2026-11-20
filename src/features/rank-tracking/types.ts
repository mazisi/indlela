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
}

export type BulkAction = 'activate' | 'deactivate' | 'delete' | 'set_frequency';

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
