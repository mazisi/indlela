import { describe, expect, it } from 'vitest';
import { formatLatLng, gridBounds, gridPoints, gridSpanKm, KM_PER_DEG_LAT, kmPerDegLng, offset, pointCount, roundCoord, samePlace, withPlannedPoints } from './geometry';
import { formatAvgRank, formatKm, formatShare, gridShape, isScanActive, scanProgress } from './labels';
import { businessPinHtml, pointMarkerHtml } from './markers';
import { pointName, RANK_TONES, rankLabel, rankMatrix, ranksToPoints, rankText, rankTone, toneCounts } from './rank';
import { gridScanBlocked, gridsFull, scanNowBlocked, searchBlocked } from './usage';
import { apiErrorOf, isNotFound, rootFieldErrors } from './errors';
import { gridSchema } from '../schemas/gridSchema';
import { grid, scan, usage } from '../test/fixtures';

const SANDTON = { lat: -26.1076, lng: 28.0567 };

describe('geometry', () => {
  it('lays out size × size points from the north-west, row 0 north and col 0 west', () => {
    const cells = gridPoints(SANDTON, 5, 1);
    expect(cells).toHaveLength(25);
    expect(cells[0]).toMatchObject({ row: 0, col: 0 });
    expect(cells[24]).toMatchObject({ row: 4, col: 4 });
    // The middle point is the centre.
    expect(cells[12]).toMatchObject({ row: 2, col: 2, lat: SANDTON.lat, lng: SANDTON.lng });
    // Row 0 is north (higher latitude), col 0 is west (lower longitude).
    expect(cells[0].lat).toBeGreaterThan(SANDTON.lat);
    expect(cells[0].lng).toBeLessThan(SANDTON.lng);
    expect(cells[24].lat).toBeLessThan(SANDTON.lat);
    expect(cells[24].lng).toBeGreaterThan(SANDTON.lng);
  });

  it('spaces points by the spacing in km, using 110.574 km per degree of latitude and 111.320·cos(lat) of longitude', () => {
    const cells = gridPoints(SANDTON, 3, 2);
    // (0, 1): 2 km north of the centre.
    expect(cells[1].lat).toBeCloseTo(SANDTON.lat + 2 / KM_PER_DEG_LAT, 7);
    expect(cells[1].lng).toBeCloseTo(SANDTON.lng, 7);
    // (1, 2): 2 km east.
    expect(cells[5].lng).toBeCloseTo(SANDTON.lng + 2 / (111.32 * Math.cos((SANDTON.lat * Math.PI) / 180)), 7);
    expect(kmPerDegLng(0)).toBeCloseTo(111.32, 5);
    expect(kmPerDegLng(60)).toBeCloseTo(55.66, 2);
  });

  it('rounds to 7 decimals, as the API stores them', () => {
    expect(roundCoord(-26.123456789)).toBe(-26.1234568);
    const p = offset(SANDTON, 0.5, 0.5);
    expect(String(p.lat).split('.')[1].length).toBeLessThanOrEqual(7);
  });

  it('reports the span, point count and bounds', () => {
    expect(gridSpanKm(5, 1)).toBe(4);
    expect(gridSpanKm(7, 0.5)).toBe(3);
    expect(pointCount(7)).toBe(49);
    const [[s, w], [n, e]] = gridBounds(SANDTON, 3, 1);
    // Half the span (1 km) plus half a spacing of margin.
    expect(n - SANDTON.lat).toBeCloseTo(1.5 / KM_PER_DEG_LAT, 6);
    expect(SANDTON.lat - s).toBeCloseTo(1.5 / KM_PER_DEG_LAT, 6);
    expect(e).toBeGreaterThan(SANDTON.lng);
    expect(w).toBeLessThan(SANDTON.lng);
  });

  it('formats and compares coordinates', () => {
    expect(formatLatLng(SANDTON)).toBe('-26.1076, 28.0567');
    expect(samePlace(SANDTON, { lat: -26.107600001, lng: 28.0567 })).toBe(true);
    expect(samePlace(SANDTON, { lat: -26.11, lng: 28.0567 })).toBe(false);
  });

  it('fills a scan’s missing points as pending at their planned place', () => {
    const planned = withPlannedPoints([{ row: 0, col: 0, done: true }], { centerLat: SANDTON.lat, centerLng: SANDTON.lng, size: 3, spacingKm: 1 }, (c) => ({ row: c.row, col: c.col, done: false }));
    expect(planned).toHaveLength(9);
    expect(planned.filter((p) => p.done)).toHaveLength(1);
  });
});

describe('rank colours and labels', () => {
  it('bands ranks: 1–3 green, 4–10 amber, 11–20 red, not found grey', () => {
    expect([1, 3, 4, 10, 11, 20, null, 21].map((r) => rankTone(r))).toEqual(['top3', 'top3', 'top10', 'top10', 'top20', 'top20', 'none', 'none']);
    expect(rankTone(5, 'pending')).toBe('pending');
    expect(RANK_TONES.top3.fill).toBe('var(--ok)');
    expect(RANK_TONES.top10.fill).toBe('var(--warn)');
    expect(RANK_TONES.top20.fill).toBe('var(--bad)');
  });

  it('labels a point: the rank, 20+ when not found', () => {
    expect(rankLabel(4)).toBe('4');
    expect(rankLabel(null)).toBe('20+');
    expect(rankLabel(null, 'pending')).toBe('…');
    expect(rankText(4)).toBe('rank 4');
    expect(rankText(null)).toBe('not in the top 20');
    expect(pointName({ row: 0, col: 2, rank: 7, status: 'done' })).toBe('Row 1, column 3: rank 7');
  });

  it('builds the matrix and counts by band', () => {
    const pts = [
      { row: 0, col: 0, rank: 1, status: 'done' as const },
      { row: 1, col: 1, rank: 15, status: 'done' as const },
      { row: 1, col: 0, rank: null, status: 'done' as const },
    ];
    const m = rankMatrix(pts, 2);
    expect(m[0][0]).toEqual({ rank: 1, status: 'done' });
    expect(m[0][1].status).toBe('pending');
    expect(toneCounts(pts)).toEqual({ top3: 1, top10: 0, top20: 1, none: 1, pending: 0 });
  });

  it('turns the list’s ranks matrix into points, row 0 north', () => {
    const pts = ranksToPoints([
      [1, null],
      [12, 4],
    ]);
    expect(pts).toEqual([
      { row: 0, col: 0, rank: 1, status: 'done' },
      { row: 0, col: 1, rank: null, status: 'done' },
      { row: 1, col: 0, rank: 12, status: 'done' },
      { row: 1, col: 1, rank: 4, status: 'done' },
    ]);
    expect(toneCounts(pts)).toEqual({ top3: 1, top10: 1, top20: 1, none: 1, pending: 0 });
  });

  it('draws the markers as plain HTML (escaped), coloured by band', () => {
    expect(pointMarkerHtml(2, 'done')).toContain('var(--ok)');
    expect(pointMarkerHtml(2, 'done')).toContain('>2</span>');
    expect(pointMarkerHtml(null, 'done')).toContain('>20+</span>');
    expect(businessPinHtml('<b>Joe’s & Co</b>')).not.toContain('<b>');
  });
});

describe('labels', () => {
  it('formats shapes, figures and progress', () => {
    expect(gridShape(5, 1)).toBe('5×5 · 1 km');
    expect(formatKm(0.5)).toBe('0.5 km');
    expect(formatAvgRank(4.333)).toBe('4.3');
    expect(formatAvgRank(null)).toBe('—');
    expect(formatShare(44.4)).toBe('44%');
    expect(formatShare(null)).toBe('—');
    expect(scanProgress({ pointsDone: 12, pointsTotal: 25 })).toBe(48);
    expect(scanProgress({ pointsDone: 0, pointsTotal: 0 })).toBe(0);
    expect(isScanActive(scan({ status: 'running' }))).toBe(true);
    expect(isScanActive(scan({ status: 'done' }))).toBe(false);
  });
});

describe('usage', () => {
  it('says why Scan now or a search cannot run, never mentioning money', () => {
    expect(scanNowBlocked(usage())).toBeNull();
    expect(scanNowBlocked(usage({ paused: true }))).toBe('Local grid scans are paused for now.');
    expect(scanNowBlocked(usage({ scansToday: { used: 10, limit: 10 } }))).toMatch(/all 10 scans for today/);
    expect(searchBlocked(usage({ searchesToday: { used: 30, limit: 30 } }))).toMatch(/all 30 business searches/);
    expect(gridsFull(usage({ grids: { used: 10, limit: 10 } }))).toBe(true);
    expect(gridsFull(usage())).toBe(false);
  });

  it('blocks a grid’s scan while one runs or the grid is paused', () => {
    expect(gridScanBlocked(grid(), null)).toBeNull();
    expect(gridScanBlocked(grid({ latestScan: scan({ status: 'queued' }) }), null)).toBe('A scan is under way.');
    expect(gridScanBlocked(grid({ isActive: false }), null)).toBe('Resume the grid to scan it.');
    expect(gridScanBlocked(grid(), 'Paused')).toBe('Paused');
  });
});

describe('errors', () => {
  it('reads status and error_type, and folds nested 422 keys onto their root field', () => {
    const e = { response: { status: 422, data: { errors: { 'business.title': ['Choose a business.'], keyword: ['Too short.'] } } } };
    expect((rootFieldErrors(e) as typeof e).response.data.errors).toEqual({ business: ['Choose a business.'], keyword: ['Too short.'] });
    expect(apiErrorOf({ response: { status: 429, data: { error_type: 'scan_limit' } } })).toEqual({ status: 429, errorType: 'scan_limit' });
    expect(isNotFound({ response: { status: 404 } })).toBe(true);
    expect(isNotFound({ response: { status: 500 } })).toBe(false);
  });
});

describe('gridSchema', () => {
  const valid = { keyword: 'coffee shop', business: { title: 'X', placeId: null, cid: null, address: null, lat: 1, lng: 2 }, centerLat: 1, centerLng: 2, size: 5, spacingKm: 1, device: 'mobile', schedule: 'none', scanNow: true, isActive: true };

  it('accepts a complete grid', () => {
    expect(gridSchema.safeParse(valid).success).toBe(true);
  });

  it('needs a keyword, a business and a centre, and only the offered sizes and spacings', () => {
    const issues = (v: object) => gridSchema.safeParse({ ...valid, ...v }).error?.issues.map((i) => i.path.join('.'));
    expect(issues({ keyword: ' a ' })).toEqual(['keyword']);
    expect(issues({ business: null })).toEqual(['business']);
    expect(issues({ centerLat: null })).toEqual(['centerLat']);
    expect(issues({ size: 4 })).toEqual(['size']);
    expect(issues({ spacingKm: 1.5 })).toEqual(['spacingKm']);
  });
});
