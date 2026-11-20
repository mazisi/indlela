export type GridSize = 3 | 5 | 7;
export type SpacingKm = 0.5 | 1 | 2 | 3 | 5;
export type GridDevice = 'mobile' | 'desktop';
export type GridSchedule = 'none' | 'weekly' | 'monthly';
export type ScanStatus = 'queued' | 'running' | 'done' | 'failed';
export type ScanTrigger = 'manual' | 'scheduled';
export type PointStatus = 'pending' | 'done' | 'failed';

/** The Google Maps listing a grid tracks. */
export interface GridBusiness {
  title: string;
  placeId: string | null;
  cid: string | null;
  address: string | null;
  lat: number;
  lng: number;
}

/** One run of a grid, with its settings frozen as they were. No cost: never shown to workspaces. */
export interface Scan {
  id: number;
  gridId: number;
  status: ScanStatus;
  trigger: ScanTrigger;
  size: GridSize;
  spacingKm: number;
  centerLat: number;
  centerLng: number;
  keyword: string;
  device: GridDevice;
  pointsTotal: number;
  pointsDone: number;
  pointsFound: number;
  /** Average rank where found; null when never found (or not finished). */
  arp: number | null;
  /** Average total rank: not-found points count as 21. Lower is better. */
  atrp: number | null;
  /** Share of local voice: % of points in the top 3 (0–100). */
  solv: number | null;
  /** % of points where the business shows at all (0–100). */
  foundPct: number | null;
  error: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  /**
   * size × size ranks, row 0 = north (null = not in the top 20). Only on a
   * grid's `latestScan` and the overview's; history scans don't carry it.
   */
  ranks?: (number | null)[][];
}

/** A saved local-rank setup for a site. */
export interface Grid {
  id: number;
  siteId: number;
  keyword: string;
  business: GridBusiness;
  centerLat: number;
  centerLng: number;
  size: GridSize;
  spacingKm: number;
  device: GridDevice;
  schedule: GridSchedule;
  isActive: boolean;
  /** Y-m-d, or null when not scheduled (or paused). */
  nextScanOn: string | null;
  createdAt: string;
  latestScan: Scan | null;
}

/** GET /local-grids/{grid}: the grid with its latest 20 scans, newest first. */
export interface GridDetail extends Grid {
  scans: Scan[];
}

/** One of the first three map results at a point. */
export interface TopResult {
  rank: number;
  title: string;
  rating: number | null;
  votes: number | null;
  domain: string | null;
  /** The tracked business. */
  isTarget: boolean;
}

/** One grid cell of a scan. Row 0 = north, col 0 = west. */
export interface ScanPoint {
  row: number;
  col: number;
  lat: number;
  lng: number;
  status: PointStatus;
  /** 1–20; null = not in the top 20 (or not checked yet). */
  rank: number | null;
  top: TopResult[];
}

/** Who holds the map pack across the grid. `id` is added by the SPA (the table wants one). */
export interface Competitor {
  id: number;
  title: string;
  cid: string | null;
  placeId: string | null;
  rating: number | null;
  votes: number | null;
  top3Points: number;
  foundPoints: number;
  avgRank: number | null;
}

/** GET /local-grid-scans/{scan}. */
export interface ScanDetail extends Scan {
  points: ScanPoint[];
  competitors: Competitor[];
}

/** A site in the overview (GET /local-grid/sites). */
export interface LocalGridSite {
  id: number;
  name: string;
  url: string;
  domain: string;
  client: { id: number; name: string } | null;
  gridsCount: number;
  latestScan: Scan | null;
}

export interface Allowance {
  used: number;
  limit: number;
}

/** GET /local-grid/usage. */
export interface LocalGridUsage {
  grids: Allowance;
  scansToday: Allowance;
  searchesToday: Allowance;
  /** Scans are on hold platform-wide. */
  paused: boolean;
}

/** A listing found by the business search. */
export interface BusinessCandidate {
  title: string;
  address: string | null;
  placeId: string | null;
  cid: string | null;
  lat: number;
  lng: number;
  rating: number | null;
  votes: number | null;
  category: string | null;
  domain: string | null;
}

export interface BusinessSearchInput {
  query: string;
  lat?: number;
  lng?: number;
}

export interface GridInput {
  keyword: string;
  business: { title: string; placeId?: string; cid?: string; address?: string; lat: number; lng: number };
  centerLat: number;
  centerLng: number;
  size: GridSize;
  spacingKm: SpacingKm;
  device: GridDevice;
  schedule: GridSchedule;
  scanNow?: boolean;
}

/** When `scanNow` was asked but the scan couldn't start: the grid is saved all the same. */
export interface ScanError {
  message: string;
  errorType: string;
}

export interface CreateGridResult {
  grid: Grid;
  scanError: ScanError | null;
}

/** The business is locked: changing it means a new grid. */
export interface GridUpdate {
  keyword?: string;
  centerLat?: number;
  centerLng?: number;
  size?: GridSize;
  spacingKm?: SpacingKm;
  device?: GridDevice;
  schedule?: GridSchedule;
  isActive?: boolean;
}
