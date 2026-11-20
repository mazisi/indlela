import type { GridSize } from '../types';

/** Kilometres in one degree of latitude (near enough everywhere). */
export const KM_PER_DEG_LAT = 110.574;
/** Kilometres in one degree of longitude at the equator; shrinks with cos(latitude). */
export const KM_PER_DEG_LNG_EQUATOR = 111.32;

export interface LatLng {
  lat: number;
  lng: number;
}

export interface GridCell extends LatLng {
  /** 0 = northmost. */
  row: number;
  /** 0 = westmost. */
  col: number;
}

/** At most 7 decimals (about a centimetre), as the API stores them. */
export const roundCoord = (n: number) => Math.round(n * 1e7) / 1e7;

export const kmPerDegLng = (lat: number) => KM_PER_DEG_LNG_EQUATOR * Math.cos((lat * Math.PI) / 180);

/** Moves a point north and east by a distance in km (negative = south / west). */
export function offset(center: LatLng, northKm: number, eastKm: number): LatLng {
  return {
    lat: roundCoord(center.lat + northKm / KM_PER_DEG_LAT),
    lng: roundCoord(center.lng + eastKm / kmPerDegLng(center.lat)),
  };
}

/**
 * The grid's points, row by row from the north-west corner: point (r, c) sits
 * ((size-1)/2 − r) × spacing north and (c − (size-1)/2) × spacing east of the
 * centre, matching the API.
 */
export function gridPoints(center: LatLng, size: GridSize | number, spacingKm: number): GridCell[] {
  const half = (size - 1) / 2;
  const cells: GridCell[] = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      cells.push({ row, col, ...offset(center, (half - row) * spacingKm, (col - half) * spacingKm) });
    }
  }
  return cells;
}

/** Edge to edge, e.g. 5×5 at 1 km covers 4 km. */
export const gridSpanKm = (size: number, spacingKm: number) => (size - 1) * spacingKm;

export const pointCount = (size: number) => size * size;

/** South-west and north-east corners, with half a spacing of margin so edge markers aren't clipped. */
export function gridBounds(center: LatLng, size: number, spacingKm: number): [[number, number], [number, number]] {
  const reach = gridSpanKm(size, spacingKm) / 2 + spacingKm / 2;
  const sw = offset(center, -reach, -reach);
  const ne = offset(center, reach, reach);
  return [
    [sw.lat, sw.lng],
    [ne.lat, ne.lng],
  ];
}

/** "-26.1076, 28.0567": four decimals is about 10 m, plenty to read. */
export const formatLatLng = ({ lat, lng }: LatLng) => `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

/** Two points closer than ~1 m are the same place. */
export const samePlace = (a: LatLng, b: LatLng) => Math.abs(a.lat - b.lat) < 1e-5 && Math.abs(a.lng - b.lng) < 1e-5;

/**
 * A scan's points with any not yet recorded filled in as pending at their
 * planned place, so a queued scan already shows its grid.
 */
export function withPlannedPoints<P extends { row: number; col: number }>(
  points: P[],
  scan: { centerLat: number; centerLng: number; size: number; spacingKm: number },
  pending: (cell: GridCell) => P,
): P[] {
  const have = new Set(points.map((p) => `${p.row}:${p.col}`));
  const missing = gridPoints({ lat: scan.centerLat, lng: scan.centerLng }, scan.size, scan.spacingKm).filter((c) => !have.has(`${c.row}:${c.col}`));
  return missing.length ? [...points, ...missing.map(pending)] : points;
}
