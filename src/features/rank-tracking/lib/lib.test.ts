import { describe, expect, it } from 'vitest';
import { tidyDigitKeys } from '../api/rankTrackingApi';
import { coordinateLocationSchema } from '../schemas/addKeywordsSchema';
import { editKeywordSchema } from '../schemas/editKeywordSchema';
import { HISTORY, usage } from '../test/fixtures';
import { formatCoordinate, parseCoordinate } from './coordinates';
import { tallyFeatures, urlTimeline } from './history';
import { parseKeywords, parseTags } from './keywords';
import { formatRank, frequencyLabel } from './position';
import { delta, pointDaysBefore } from './summary';
import { checkNowBlocked, checksNowLeft, keywordsLeft, keywordsToAdd, usageLevel, usagePercent } from './usage';

describe('usage', () => {
  it('counts keywords × locations × devices, zero when anything is missing', () => {
    expect(keywordsToAdd(10, 2, 2)).toBe(40);
    expect(keywordsToAdd(0, 3, 2)).toBe(0);
    expect(keywordsToAdd(5, 0, 2)).toBe(0);
  });

  it('says what is left, never below zero', () => {
    expect(keywordsLeft(usage())).toBe(320);
    expect(keywordsLeft(usage({ keywordsTracked: 520 }))).toBe(0);
    expect(checksNowLeft(usage())).toBe(17);
    expect(checksNowLeft(usage({ checksNowToday: 25 }))).toBe(0);
  });

  it('turns amber from 80 % and red at the limit', () => {
    expect(usageLevel(399, 500)).toBe('ok');
    expect(usageLevel(400, 500)).toBe('near');
    expect(usageLevel(500, 500)).toBe('full');
    expect(usageLevel(0, 0)).toBe('full');
    expect(usagePercent(180, 500)).toBe(36);
    expect(usagePercent(600, 500)).toBe(100);
  });

  it('blocks Check now when paused or none are left today', () => {
    expect(checkNowBlocked(usage())).toBeNull();
    expect(checkNowBlocked(undefined)).toBeNull();
    expect(checkNowBlocked(usage({ paused: true }))).toBe('Rank checks are paused for now.');
    expect(checkNowBlocked(usage({ checksNowToday: 20 }))).toMatch(/used all 20 instant checks/);
  });
});

describe('parseKeywords', () => {
  it('trims, collapses spaces, skips blanks and drops case-insensitive duplicates', () => {
    expect(parseKeywords('  plumber  sandton \n\nPlumber Sandton\ngeyser repairs\r\nplumber sandton\n')).toEqual({ keywords: ['plumber sandton', 'geyser repairs'], duplicates: 2 });
    expect(parseKeywords('   \n')).toEqual({ keywords: [], duplicates: 0 });
  });

  it('splits tags on commas without repeats', () => {
    expect(parseTags('brand, Services,, brand ,services')).toEqual(['brand', 'Services']);
  });
});

describe('coordinates', () => {
  it('reads "lat, lng" in decimal degrees', () => {
    expect(parseCoordinate('-26.1076, 28.0567')).toEqual({ lat: -26.1076, lng: 28.0567 });
    expect(formatCoordinate({ lat: -26.1076, lng: 28.0567 })).toBe('-26.1076,28.0567');
  });

  it.each(['-26.1076', '-96.1, 28', '-26.1, 181', 'Sandton', '-26.1;28.0', '1,2,3', ''])('rejects %j', (text) => {
    expect(parseCoordinate(text)).toBeNull();
  });

  it('validates a suburb by coordinates with plain-English messages', () => {
    expect(coordinateLocationSchema.safeParse({ name: 'Sandton', coordinate: '-26.1076, 28.0567' }).success).toBe(true);
    const bad = coordinateLocationSchema.safeParse({ name: ' ', coordinate: '28.0567' });
    expect(bad.success).toBe(false);
    const messages = bad.error?.issues.map((i) => `${String(i.path[0])}: ${i.message}`);
    expect(messages).toEqual(['name: Name the place, e.g. Sandton.', 'coordinate: Use “latitude, longitude” in decimal degrees, e.g. -26.1076, 28.0567.']);
  });
});

describe('editKeywordSchema', () => {
  it('needs a day for weekly checks only', () => {
    expect(editKeywordSchema.safeParse({ frequency: 'daily', weeklyDay: '', tagsText: '', isActive: true }).success).toBe(true);
    expect(editKeywordSchema.safeParse({ frequency: 'weekly', weeklyDay: '', tagsText: '', isActive: true }).success).toBe(false);
    expect(editKeywordSchema.safeParse({ frequency: 'weekly', weeklyDay: '3', tagsText: '', isActive: true }).success).toBe(true);
  });
});

describe('positions', () => {
  it('shows — for not ranking', () => {
    expect(formatRank(null)).toBe('—');
    expect(formatRank(0)).toBe('—');
    expect(formatRank(7)).toBe('7');
    expect(frequencyLabel('weekly', 1)).toBe('Weekly · Mondays');
    expect(frequencyLabel('daily', null)).toBe('Daily');
  });
});

describe('tidyDigitKeys', () => {
  it('joins digits split off by the case transform, at any depth', () => {
    expect(tidyDigitKeys({ change_7d: 1, change_7dAvg: 2, distribution_7dAgo: { top3: 1 }, rows: [{ change_30d: 3 }] })).toEqual({
      change7d: 1,
      change7dAvg: 2,
      distribution7dAgo: { top3: 1 },
      rows: [{ change30d: 3 }],
    });
  });
});

describe('history', () => {
  it('lists ranking URL runs, skipping checks out of the top 100', () => {
    expect(urlTimeline(HISTORY)).toEqual([
      { url: 'https://www.karoocoffee.co.za/blog/beans', from: HISTORY[0].date, to: HISTORY[1].date, checks: 2 },
      { url: 'https://www.karoocoffee.co.za/shop', from: HISTORY[3].date, to: HISTORY[5].date, checks: 3 },
    ]);
  });

  it('tallies SERP features over the checks', () => {
    expect(tallyFeatures(HISTORY, ['featuredSnippet', 'localPack', 'aiOverview'])).toEqual({
      featuredSnippet: { present: 3, ours: 1 },
      localPack: { present: 6, ours: 0 },
      aiOverview: { present: 0, ours: 0 },
    });
  });

  it('finds the point a week before the last', () => {
    const series = ['2026-11-01', '2026-11-05', '2026-11-12', '2026-11-13'].map((date, i) => ({ date, visibility: i, avgPosition: null }));
    expect(pointDaysBefore(series, 7)?.date).toBe('2026-11-05');
    expect(pointDaysBefore(series.slice(2), 7)).toBeUndefined();
    expect(delta(5, 3)).toBe(2);
    expect(delta(5, null)).toBeNull();
  });
});
