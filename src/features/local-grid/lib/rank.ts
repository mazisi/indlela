import type { PointStatus, ScanPoint } from '../types';

/** The deepest result a scan reads: anything past it is "not found". */
export const MAX_RANK = 20;

export type RankTone = 'top3' | 'top10' | 'top20' | 'none' | 'pending';

interface ToneStyle {
  /** For the legend. */
  label: string;
  /** Marker fill (a CSS colour, the house status tokens). */
  fill: string;
  /** Text on the fill. */
  ink: string;
}

/** 1–3 green, 4–10 amber, 11–20 red, not found grey; not checked yet a pale grey. */
export const RANK_TONES: Record<RankTone, ToneStyle> = {
  top3: { label: '1–3', fill: 'var(--ok)', ink: '#ffffff' },
  top10: { label: '4–10', fill: 'var(--warn)', ink: '#ffffff' },
  top20: { label: '11–20', fill: 'var(--bad)', ink: '#ffffff' },
  none: { label: 'Not in the top 20', fill: 'var(--muted-foreground)', ink: '#ffffff' },
  pending: { label: 'Not checked yet', fill: 'var(--muted)', ink: 'var(--muted-foreground)' },
};

/** The legend's order (pending only shows while a scan runs). */
export const LEGEND_TONES: RankTone[] = ['top3', 'top10', 'top20', 'none'];

export function rankTone(rank: number | null | undefined, status: PointStatus = 'done'): RankTone {
  if (status === 'pending') return 'pending';
  if (!rank || rank > MAX_RANK) return 'none';
  if (rank <= 3) return 'top3';
  if (rank <= 10) return 'top10';
  return 'top20';
}

/** What a marker shows: the rank, "20+" when not found, "…" while not checked. */
export function rankLabel(rank: number | null | undefined, status: PointStatus = 'done'): string {
  if (status === 'pending') return '…';
  if (status === 'failed') return '!';
  return rank && rank <= MAX_RANK ? String(rank) : `${MAX_RANK}+`;
}

/** The point's rank in words, for screen readers and titles. */
export function rankText(rank: number | null | undefined, status: PointStatus = 'done'): string {
  if (status === 'pending') return 'not checked yet';
  if (status === 'failed') return 'check failed';
  return rank && rank <= MAX_RANK ? `rank ${rank}` : `not in the top ${MAX_RANK}`;
}

/** Points as a size × size matrix of ranks (row 0 = north), for the SVG grids. Missing cells are pending. */
export function rankMatrix(points: Pick<ScanPoint, 'row' | 'col' | 'rank' | 'status'>[], size: number): { rank: number | null; status: PointStatus }[][] {
  const matrix = Array.from({ length: size }, () => Array.from({ length: size }, () => ({ rank: null as number | null, status: 'pending' as PointStatus })));
  points.forEach((p) => {
    if (p.row >= 0 && p.row < size && p.col >= 0 && p.col < size) matrix[p.row][p.col] = { rank: p.rank, status: p.status };
  });
  return matrix;
}

/** How many points fall in each tone, for the legend's counts. */
export function toneCounts(points: Pick<ScanPoint, 'rank' | 'status'>[]): Record<RankTone, number> {
  const counts: Record<RankTone, number> = { top3: 0, top10: 0, top20: 0, none: 0, pending: 0 };
  points.forEach((p) => {
    counts[p.status === 'failed' ? 'none' : rankTone(p.rank, p.status)] += 1;
  });
  return counts;
}

/** "Row 2, column 3: rank 4", for a point's accessible name. */
export const pointName = (p: Pick<ScanPoint, 'row' | 'col' | 'rank' | 'status'>) => `Row ${p.row + 1}, column ${p.col + 1}: ${rankText(p.rank, p.status)}`;

/** A list scan's `ranks` matrix as points for the mini heatmap (every cell checked). */
export const ranksToPoints = (ranks: (number | null)[][]) =>
  ranks.flatMap((row, r) => row.map((rank, c) => ({ row: r, col: c, rank, status: 'done' as PointStatus })));
