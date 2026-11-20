import type { RankUsage } from '../types';

/** From this share of the keyword limit the bar turns amber. */
export const NEAR_LIMIT_RATIO = 0.8;

export type UsageLevel = 'ok' | 'near' | 'full';

/** How close the workspace is to its keyword limit: amber from 80 %, red at 100 %. */
export function usageLevel(used: number, limit: number): UsageLevel {
  if (limit <= 0 || used >= limit) return 'full';
  return used / limit >= NEAR_LIMIT_RATIO ? 'near' : 'ok';
}

/** 0–100, for the progress bar. */
export const usagePercent = (used: number, limit: number) => (limit <= 0 ? 100 : Math.min(100, Math.max(0, Math.round((used / limit) * 100))));

export const keywordsLeft = (usage: RankUsage) => Math.max(0, usage.keywordLimit - usage.keywordsTracked);

export const checksNowLeft = (usage: RankUsage) => Math.max(0, usage.checkNowLimit - usage.checksNowToday);

/** Each keyword is tracked in every location, on every device: that's what counts against the limit. */
export const keywordsToAdd = (keywords: number, locations: number, devices: number) => Math.max(0, keywords) * Math.max(0, locations) * Math.max(0, devices);

/** Why Check now is unavailable, or null when it can run. */
export function checkNowBlocked(usage: RankUsage | undefined): string | null {
  if (!usage) return null;
  if (usage.paused) return 'Rank checks are paused for now.';
  if (checksNowLeft(usage) === 0) return `You've used all ${usage.checkNowLimit} instant checks for today. They reset at midnight.`;
  return null;
}
