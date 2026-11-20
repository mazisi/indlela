import type { DataColumn } from '@/components/table/DataTable';
import { formatNumber, formatPosition } from '@/features/search-console/lib/format';
import { formatShare } from '../../lib/competitors';
import type { Competitor } from '../../types';
import { SeriesSwatch } from './ShareOfVoiceCard';

const stat = (c: Competitor, pick: (s: NonNullable<Competitor['latest']>) => string) => (c.latest ? pick(c.latest) : '—');

/** Also shapes the loading skeleton. */
export const competitorColumns = (colors: Map<number, string>): DataColumn<Competitor, string>[] => [
  {
    label: 'Competitor',
    skeleton: 'w-40',
    cell: (c) => (
      <span className="flex min-w-0 items-start gap-2">
        <SeriesSwatch color={colors.get(c.id) ?? 'var(--chart-compare)'} className={c.isActive ? 'mt-1.5' : 'mt-1.5 opacity-40'} />
        <span className="min-w-0">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-sm font-medium">{c.name}</span>
            {!c.isActive && <span className="shrink-0 rounded bg-muted px-1.5 py-px text-2xs font-semibold text-muted-foreground">Paused</span>}
            {c.isActive && !c.hasHistory && (
              <span className="shrink-0 rounded bg-accent px-1.5 py-px text-2xs font-semibold text-accent-foreground" title="Positions appear after the next check of your keywords.">
                Collecting
              </span>
            )}
          </span>
          {c.name !== c.domain && <span className="block truncate text-xs text-muted-foreground">{c.domain}</span>}
        </span>
      </span>
    ),
  },
  { label: 'Top 3', align: 'right', skeleton: 'w-6', cell: (c) => <span className="tabular-nums">{stat(c, (s) => formatNumber(s.top3))}</span> },
  { label: 'Top 10', align: 'right', skeleton: 'w-6', cell: (c) => <span className="tabular-nums">{stat(c, (s) => formatNumber(s.top10))}</span> },
  { label: 'Ranked', align: 'right', skeleton: 'w-6', cell: (c) => <span className="tabular-nums">{stat(c, (s) => formatNumber(s.ranked))}</span> },
  { label: 'Avg position', align: 'right', skeleton: 'w-8', cell: (c) => <span className="tabular-nums">{stat(c, (s) => formatPosition(s.avgPosition))}</span> },
  { label: 'Share of voice', align: 'right', skeleton: 'w-10', cell: (c) => <span className="font-semibold tabular-nums">{stat(c, (s) => formatShare(s.sov))}</span> },
];
