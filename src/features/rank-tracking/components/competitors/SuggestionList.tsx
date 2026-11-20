import type { ReactNode } from 'react';
import { Globe } from 'lucide-react';
import { formatNumber } from '@/features/search-console/lib/format';
import { formatRank } from '../../lib/position';
import type { CompetitorSuggestion } from '../../types';

const plural = (n: number, one: string, many = `${one}s`) => `${formatNumber(n)} ${n === 1 ? one : many}`;

interface Props {
  suggestions: CompetitorSuggestion[];
  /** The site's tracked keywords, for "N of M"; null leaves it out. */
  keywordsTotal: number | null;
  renderAction: (suggestion: CompetitorSuggestion) => ReactNode;
}

/** Domains that show up most in the site's top 10s, each with one action (Add / Use). */
export function SuggestionList({ suggestions, keywordsTotal, renderAction }: Props) {
  return (
    <ul className="divide-y rounded border bg-card" aria-label="Suggested competitors">
      {suggestions.map((s) => (
        <li key={s.domain} className="flex items-center justify-between gap-3 px-3 py-2">
          <span className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-7 shrink-0 place-items-center rounded bg-muted text-muted-foreground">
              <Globe className="size-3.5" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{s.domain}</span>
              <span className="block text-xs text-muted-foreground">
                Seen in the top 10 for {keywordsTotal ? `${formatNumber(s.top10Keywords)} of your ${plural(keywordsTotal, 'keyword')}` : `${formatNumber(s.top10Keywords)} of your keywords`}
                {s.bestPosition ? ` · best #${formatRank(s.bestPosition)}` : ''}
              </span>
            </span>
          </span>
          {renderAction(s)}
        </li>
      ))}
    </ul>
  );
}
