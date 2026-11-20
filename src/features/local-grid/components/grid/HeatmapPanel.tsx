import { useState } from 'react';
import { Segmented } from '@/components/form/Segmented';
import { toneCounts } from '../../lib/rank';
import type { GridBusiness, ScanDetail, ScanPoint } from '../../types';
import HeatmapMap from '../map/HeatmapMap';
import { Legend } from './Legend';
import { PointGrid } from './PointGrid';

type View = 'map' | 'grid';
const VIEWS = [
  ['map', 'Map'],
  ['grid', 'Grid'],
] as const;

interface Props {
  scan: ScanDetail;
  business: GridBusiness;
  selected: ScanPoint | undefined;
  onSelect: (point: ScanPoint) => void;
}

/**
 * The scan's heatmap: on the map (default) or as a plain grid, with the
 * legend and counts. When map tiles can't load, it switches to the grid.
 */
export function HeatmapPanel({ scan, business, selected, onSelect }: Props) {
  const [view, setView] = useState<View>('map');
  const [tilesFailed, setTilesFailed] = useState(false);
  const shown: View = tilesFailed ? 'grid' : view;
  const counts = toneCounts(scan.points);

  return (
    <section className="space-y-3 rounded border bg-card p-4 shadow-xs" aria-labelledby="heatmap-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="heatmap-title" className="text-base font-semibold">
            Heatmap
          </h2>
          <p className="text-xs text-muted-foreground">Rank in the Google map results at each point. Select a point for its top 3.</p>
        </div>
        {!tilesFailed && <Segmented label="Heatmap view" value={view} onChange={setView} options={VIEWS} />}
      </div>
      <Legend counts={counts} showPending={counts.pending > 0} />
      {tilesFailed && <p className="text-xs text-muted-foreground">The map couldn't load, so the grid shows without it (north at the top).</p>}
      {shown === 'map' ? (
        <HeatmapMap
          points={scan.points}
          size={scan.size}
          spacingKm={scan.spacingKm}
          center={{ lat: scan.centerLat, lng: scan.centerLng }}
          business={business}
          selected={selected}
          onSelect={onSelect}
          onTilesFailed={() => setTilesFailed(true)}
        />
      ) : (
        <PointGrid points={scan.points} size={scan.size} selected={selected} onSelect={onSelect} />
      )}
    </section>
  );
}
