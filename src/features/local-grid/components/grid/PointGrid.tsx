import { cn } from '@/lib/utils';
import { pointName, RANK_TONES, rankLabel, rankTone } from '../../lib/rank';
import type { ScanPoint } from '../../types';

interface Props {
  points: ScanPoint[];
  size: number;
  selected: ScanPoint | undefined;
  onSelect: (point: ScanPoint) => void;
}

/**
 * The scan as a plain grid of coloured squares (north at the top): the view
 * without a map, and the fallback when map tiles can't load. Each cell is a
 * button that opens the point.
 */
export function PointGrid({ points, size, selected, onSelect }: Props) {
  const sorted = [...points].sort((a, b) => a.row - b.row || a.col - b.col);
  return (
    <div className="grid place-items-center rounded border bg-muted/20 p-4 sm:p-6">
      <div role="group" aria-label="Heatmap grid, north at the top" className="grid w-full max-w-md gap-1.5" style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}>
        {sorted.map((p) => {
          const tone = RANK_TONES[p.status === 'failed' ? 'none' : rankTone(p.rank, p.status)];
          const isSelected = selected?.row === p.row && selected?.col === p.col;
          return (
            <button
              key={`${p.row}-${p.col}`}
              type="button"
              onClick={() => onSelect(p)}
              aria-label={pointName(p)}
              aria-pressed={isSelected}
              data-tone={rankTone(p.rank, p.status)}
              className={cn(
                'grid aspect-square place-items-center rounded text-sm font-bold tabular-nums shadow-xs transition-transform hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                isSelected && 'ring-2 ring-primary ring-offset-2',
              )}
              style={{ background: tone.fill, color: tone.ink }}
            >
              {rankLabel(p.rank, p.status)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
