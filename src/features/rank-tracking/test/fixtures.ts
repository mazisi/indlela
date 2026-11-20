import type { CannibalisedRow, KeywordHistoryPoint, RankKeyword, RankSite, RankSummary, RankUsage } from '../types';

export function rankSite(over: Partial<RankSite> = {}): RankSite {
  return {
    id: 7,
    name: 'Karoo Coffee',
    url: 'https://www.karoocoffee.co.za',
    client: { id: 1, name: 'Karoo Coffee Co' },
    keywordsCount: 24,
    avgPosition: 8.4,
    top3: 5,
    top10: 14,
    top100: 21,
    change7dAvg: 1.6,
    lastCheckedOn: '2026-11-19',
    ...over,
  };
}

export function usage(over: Partial<RankUsage> = {}): RankUsage {
  return { keywordsTracked: 180, keywordLimit: 500, checksNowToday: 3, checkNowLimit: 20, paused: false, ...over };
}

const days = (n: number, end = '2026-11-19') => {
  const last = Date.parse(`${end}T00:00:00Z`);
  return Array.from({ length: n }, (_, i) => new Date(last - (n - 1 - i) * 86_400_000).toISOString().slice(0, 10));
};

export function keyword(over: Partial<RankKeyword> = {}): RankKeyword {
  return {
    id: 501,
    keyword: 'coffee beans johannesburg',
    location: { type: 'code', code: 1003710, name: 'Johannesburg' },
    languageCode: 'en',
    device: 'desktop',
    frequency: 'daily',
    weeklyDay: null,
    tags: ['shop'],
    isActive: true,
    position: 4,
    previousPosition: 6,
    change1d: 2,
    change7d: 5,
    change30d: -3,
    bestPosition: 3,
    url: 'https://www.karoocoffee.co.za/shop',
    urlChanged: false,
    cannibalised: false,
    serpFeatures: { featuredSnippet: { present: true, ours: true }, localPack: { present: true, ours: false }, aiOverview: { present: false, ours: false } },
    lastCheckedOn: '2026-11-19',
    lastCheckStatus: 'done',
    history: days(5).map((date, i) => ({ date, position: [9, 7, null, 6, 4][i] })),
    ...over,
  };
}

export const NOT_RANKING = keyword({
  id: 502,
  keyword: 'buy espresso machine',
  device: 'mobile',
  location: { type: 'coordinate', coordinate: '-26.1076,28.0567', name: 'Sandton' },
  position: null,
  previousPosition: 88,
  change1d: null,
  change7d: null,
  change30d: null,
  bestPosition: 41,
  url: null,
  serpFeatures: null,
  tags: [],
  history: days(3).map((date, i) => ({ date, position: [60, 88, null][i] })),
});

export function page<T>(data: T[], total = data.length) {
  return { data, meta: { currentPage: 1, lastPage: Math.ceil(total / 15) || 1, perPage: 15, total, from: 1, to: data.length } };
}

export function summary(over: Partial<RankSummary> = {}): RankSummary {
  return {
    keywordsCount: 24,
    avgPosition: 8.4,
    distribution: { top3: 5, top10: 9, top20: 4, top100: 3, notRanking: 3 },
    distribution7dAgo: { top3: 3, top10: 9, top20: 5, top100: 4, notRanking: 3 },
    visibility: 34.2,
    visibilitySeries: days(10).map((date, i) => ({ date, visibility: 30 + i * 0.5, avgPosition: 10 - i * 0.2 })),
    gains: [{ keywordId: 501, keyword: 'coffee beans johannesburg', locationName: 'Johannesburg', device: 'desktop', from: 9, to: 4, change: 5 }],
    drops: [{ keywordId: 503, keyword: 'coffee subscription', locationName: 'South Africa', device: 'mobile', from: 12, to: 19, change: -7 }],
    serpFeatures: { featuredSnippet: { present: 6, ours: 2 }, localPack: { present: 9, ours: 4 }, aiOverview: { present: 5, ours: 1 } },
    cannibalisedCount: 2,
    ...over,
  };
}

export const HISTORY: KeywordHistoryPoint[] = days(6).map((date, i) => ({
  date,
  position: [12, 9, null, 7, 5, 4][i],
  url: [
    'https://www.karoocoffee.co.za/blog/beans',
    'https://www.karoocoffee.co.za/blog/beans',
    null,
    'https://www.karoocoffee.co.za/shop',
    'https://www.karoocoffee.co.za/shop',
    'https://www.karoocoffee.co.za/shop',
  ][i],
  serpFeatures: { featuredSnippet: { present: i > 2, ours: i > 4 }, localPack: { present: true, ours: false } },
}));

export const CANNIBALISED: CannibalisedRow[] = [
  {
    id: 504,
    keywordId: 504,
    keyword: 'cold brew coffee',
    locationName: 'South Africa',
    device: 'desktop',
    urls: [
      { url: 'https://www.karoocoffee.co.za/blog/cold-brew-guide', position: 14 },
      { url: 'https://www.karoocoffee.co.za/shop/cold-brew', position: 8 },
    ],
  },
];
