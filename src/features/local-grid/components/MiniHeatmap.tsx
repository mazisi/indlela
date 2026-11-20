import { RANK_TONES, rankMatrix, rankTone, ranksToPoints, toneCounts } from '../lib/rank';
import type { Scan, ScanPoint } from '../types';
import { Muted, ScanStatusBadge } from './cells';

const WIDTH = 44;
const GAP = 1.5;

/** A scan's ranks as a small square of coloured cells (no map), with the counts in its accessible name. */
export function MiniHeatmap({ points, size }: { points: Pick<ScanPoint, 'row' | 'col' | 'rank' | 'status'>[]; size: number }) {
  const cell = (WIDTH - GAP * (size - 1)) / size;
  const counts = toneCounts(points);
  const label = `Heatmap: ${counts.top3} of ${size * size} points in the top 3, ${counts.top10} in 4–10, ${counts.top20} in 11–20, ${counts.none} not in the top 20.`;
  return (
    <svg width={WIDTH} height={WIDTH} viewBox={`0 0 ${WIDTH} ${WIDTH}`} role="img" aria-label={label} data-testid="mini-heatmap" className="shrink-0">
      <title>{label}</title>
      {rankMatrix(points, size).map((row, r) =>
        row.map((p, c) => (
          <rect key={`${r}-${c}`} x={c * (cell + GAP)} y={r * (cell + GAP)} width={cell} height={cell} rx={1} fill={RANK_TONES[p.status === 'failed' ? 'none' : rankTone(p.rank, p.status)].fill} />
        )),
      )}
    </svg>
  );
}

/**
 * A grid's latest scan as a mini heatmap, from the `ranks` the list carries;
 * a scan under way (or failed) shows its status instead.
 */
export function LatestScanHeatmap({ scan }: { scan: Scan | null }) {
  if (!scan) return <Muted>Not scanned yet</Muted>;
  if (scan.status !== 'done') return <ScanStatusBadge scan={scan} />;
  if (!scan.ranks?.length) return <Muted>—</Muted>;
  return <MiniHeatmap points={ranksToPoints(scan.ranks)} size={scan.size} />;
}
