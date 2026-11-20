import type { KeywordHistoryPoint, SerpFeatureKey } from '../types';

export interface UrlSpell {
  url: string;
  /** First and last check this URL ranked on (Y-m-d). */
  from: string;
  to: string;
  checks: number;
}

/**
 * Which of the site's URLs ranked, as runs in date order: a new run starts
 * when the ranking URL changes. Checks where the site didn't rank are skipped
 * (they neither end nor start a run).
 */
export function urlTimeline(points: KeywordHistoryPoint[]): UrlSpell[] {
  const spells: UrlSpell[] = [];
  for (const p of points) {
    if (!p.url) continue;
    const last = spells[spells.length - 1];
    if (last && last.url === p.url) {
      last.to = p.date;
      last.checks += 1;
    } else {
      spells.push({ url: p.url, from: p.date, to: p.date, checks: 1 });
    }
  }
  return spells;
}

export interface FeatureTally {
  /** Checks on which the feature showed. */
  present: number;
  /** …and the site appeared in it. */
  ours: number;
}

/** For each SERP feature: on how many of the checks it showed, and how often the site was in it. */
export function tallyFeatures(points: KeywordHistoryPoint[], keys: SerpFeatureKey[]): Record<SerpFeatureKey, FeatureTally> {
  const tally = Object.fromEntries(keys.map((k) => [k, { present: 0, ours: 0 }])) as Record<SerpFeatureKey, FeatureTally>;
  for (const p of points) {
    for (const k of keys) {
      const f = p.serpFeatures?.[k];
      if (f?.present) {
        tally[k].present += 1;
        if (f.ours) tally[k].ours += 1;
      }
    }
  }
  return tally;
}
