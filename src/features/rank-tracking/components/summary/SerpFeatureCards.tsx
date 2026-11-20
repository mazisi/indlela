import { formatNumber } from '@/features/search-console/lib/format';
import type { RankSummary } from '../../types';
import { SERP_FEATURES } from '../../lib/serpFeatures';

/** Featured snippet, map pack and AI overview: how many keywords show one, and in how many the site appears. */
export function SerpFeatureCards({ features }: { features: RankSummary['serpFeatures'] }) {
  return (
    <section aria-label="SERP features" className="grid gap-3 sm:grid-cols-3">
      {SERP_FEATURES.map(({ key, label, icon: Icon }) => {
        const { present, ours } = features[key] ?? { present: 0, ours: 0 };
        const share = present ? Math.round((ours / present) * 100) : 0;
        return (
          <div key={key} className="rounded border bg-card px-4 py-3 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded bg-accent text-primary" aria-hidden>
                <Icon className="size-3.5" />
              </span>
              <h3 className="text-sm font-semibold">{label}</h3>
            </div>
            <p className="mt-2 text-sm">
              {present ? (
                <>
                  Present for <span className="font-semibold tabular-nums">{formatNumber(present)}</span> {present === 1 ? 'keyword' : 'keywords'} · you appear in{' '}
                  <span className="font-semibold tabular-nums">{formatNumber(ours)}</span>
                </>
              ) : (
                <span className="text-muted-foreground">Not shown for any tracked keyword</span>
              )}
            </p>
            {present > 0 && (
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" role="img" aria-label={`You appear in ${share}% of them`}>
                <div className="h-full rounded-full bg-primary" style={{ width: `${share}%` }} />
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
