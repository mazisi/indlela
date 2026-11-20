import { gridPoints } from '../lib/geometry';
import type { BusinessCandidate, Competitor, Grid, GridDetail, LocalGridSite, LocalGridUsage, Scan, ScanDetail, ScanPoint } from '../types';

export const CENTER = { lat: -26.1076, lng: 28.0567 };

export const usage = (over: Partial<LocalGridUsage> = {}): LocalGridUsage => ({
  grids: { used: 3, limit: 10 },
  scansToday: { used: 2, limit: 10 },
  searchesToday: { used: 3, limit: 30 },
  paused: false,
  ...over,
});

/** Ranks of a 3×3 scan, row by row from the north-west: 1–3 green, 4–10 amber, 11–20 red, null not found. */
export const RANKS: (number | null)[] = [1, 2, 5, 3, 1, 12, null, 8, null];

/** The same as the list's size × size matrix. */
export const RANK_ROWS = [RANKS.slice(0, 3), RANKS.slice(3, 6), RANKS.slice(6, 9)];

export const scan = (over: Partial<Scan> = {}): Scan => ({
  id: 901,
  gridId: 51,
  status: 'done',
  trigger: 'manual',
  size: 3,
  spacingKm: 1,
  centerLat: CENTER.lat,
  centerLng: CENTER.lng,
  keyword: 'coffee shop',
  device: 'mobile',
  pointsTotal: 9,
  pointsDone: 9,
  pointsFound: 7,
  arp: 4.3,
  atrp: 8.0,
  solv: 44.4,
  foundPct: 77.8,
  error: null,
  startedAt: '2026-11-19T08:00:00+02:00',
  finishedAt: '2026-11-19T08:01:10+02:00',
  createdAt: '2026-11-19T08:00:00+02:00',
  ranks: RANK_ROWS,
  ...over,
});

export const site = (over: Partial<LocalGridSite> = {}): LocalGridSite => ({
  id: 7,
  name: 'Karoo Coffee',
  url: 'https://www.karoocoffee.co.za',
  domain: 'karoocoffee.co.za',
  client: { id: 1, name: 'Karoo Coffee Co' },
  gridsCount: 2,
  latestScan: scan(),
  ...over,
});

export const BUSINESS = { title: 'Karoo Coffee Sandton', placeId: 'ChIJkaroo', cid: '123456', address: '12 Rivonia Rd, Sandton', lat: CENTER.lat, lng: CENTER.lng };

export const grid = (over: Partial<Grid> = {}): Grid => ({
  id: 51,
  siteId: 7,
  keyword: 'coffee shop',
  business: BUSINESS,
  centerLat: CENTER.lat,
  centerLng: CENTER.lng,
  size: 3,
  spacingKm: 1,
  device: 'mobile',
  schedule: 'weekly',
  isActive: true,
  nextScanOn: '2026-11-26',
  createdAt: '2026-11-01T09:00:00+02:00',
  latestScan: scan(),
  ...over,
});

export const OLDER = scan({ id: 900, ranks: undefined, arp: 6.1, solv: 22.2, foundPct: 66.7, atrp: 10.4, finishedAt: '2026-11-12T08:01:10+02:00', startedAt: '2026-11-12T08:00:00+02:00', createdAt: '2026-11-12T08:00:00+02:00' });

export const gridDetail = (over: Partial<GridDetail> = {}): GridDetail => ({ ...grid(), scans: [scan(), OLDER], ...over });


export const points = (ranks: (number | null)[] = RANKS, status: ScanPoint['status'] = 'done'): ScanPoint[] =>
  gridPoints(CENTER, 3, 1).map((c, i) => ({
    ...c,
    status,
    rank: ranks[i] ?? null,
    top: [
      { rank: 1, title: ranks[i] === 1 ? BUSINESS.title : 'Bean There', rating: 4.6, votes: 210, domain: 'beanthere.co.za', isTarget: ranks[i] === 1 },
      { rank: 2, title: ranks[i] === 2 ? BUSINESS.title : 'Father Coffee', rating: 4.8, votes: 1340, domain: null, isTarget: ranks[i] === 2 },
      { rank: 3, title: ranks[i] === 3 ? BUSINESS.title : 'Vovo Telo', rating: 4.3, votes: 88, domain: 'vovotelo.co.za', isTarget: ranks[i] === 3 },
    ],
  }));

export const COMPETITORS: Competitor[] = [
  { id: 1, title: 'Bean There', cid: '999', placeId: 'ChIJbean', rating: 4.6, votes: 210, top3Points: 6, foundPoints: 9, avgRank: 2.1 },
  { id: 2, title: 'Karoo Coffee Sandton', cid: '123456', placeId: 'ChIJkaroo', rating: 4.7, votes: 96, top3Points: 4, foundPoints: 7, avgRank: 4.3 },
];

export const scanDetail = (over: Partial<ScanDetail> = {}): ScanDetail => ({ ...scan(), points: points(), competitors: COMPETITORS, ...over });

export const candidate = (over: Partial<BusinessCandidate> = {}): BusinessCandidate => ({
  title: 'Karoo Coffee Sandton',
  address: '12 Rivonia Rd, Sandton',
  placeId: 'ChIJkaroo',
  cid: '123456',
  lat: -26.1,
  lng: 28.05,
  rating: 4.7,
  votes: 96,
  category: 'Coffee shop',
  domain: 'karoocoffee.co.za',
  ...over,
});
