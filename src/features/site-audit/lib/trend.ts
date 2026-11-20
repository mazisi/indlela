import type { Audit } from '../types';

export interface TrendPoint {
  id: number;
  date: string;
  score: number;
}

/** Finished audits' health scores, oldest first. */
export function trendPoints(audits: Audit[]): TrendPoint[] {
  return audits
    .filter((a) => a.status === 'done' && a.healthScore !== null && a.finishedAt)
    .map((a) => ({ id: a.id, date: a.finishedAt as string, score: a.healthScore as number }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

