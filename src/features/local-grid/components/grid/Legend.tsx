import { formatNumber } from '@/features/search-console/lib/format';
import { LEGEND_TONES, RANK_TONES, type RankTone } from '../../lib/rank';

/** The heatmap's colour key, with how many points fall in each band. */
export function Legend({ counts, showPending }: { counts?: Record<RankTone, number>; showPending?: boolean }) {
  const tones = showPending ? [...LEGEND_TONES, 'pending' as const] : LEGEND_TONES;
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground" aria-label="Legend">
      {tones.map((t) => (
        <li key={t} className="inline-flex items-center gap-1.5">
          <span aria-hidden className="size-3 rounded-full ring-1 ring-black/10" style={{ background: RANK_TONES[t].fill }} />
          <span>{RANK_TONES[t].label}</span>
          {counts && <span className="font-semibold tabular-nums text-foreground">{formatNumber(counts[t])}</span>}
        </li>
      ))}
      <li className="inline-flex items-center gap-1.5">
        <svg aria-hidden viewBox="0 0 26 34" className="h-3.5 w-3">
          <path d="M13 1C6.4 1 1 6.3 1 12.9 1 21.8 13 33 13 33s12-11.2 12-20.1C25 6.3 19.6 1 13 1z" fill="var(--primary)" />
        </svg>
        The business
      </li>
    </ul>
  );
}
