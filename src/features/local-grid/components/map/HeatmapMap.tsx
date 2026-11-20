import 'leaflet/dist/leaflet.css';
import { MapContainer, Marker } from 'react-leaflet';
import { pointName } from '../../lib/rank';
import type { GridBusiness, ScanPoint } from '../../types';
import { FitBounds } from './FitBounds';
import { MapTiles } from './MapTiles';
import { businessIcon, pointIcon } from './leafletIcons';

export interface HeatmapMapProps {
  points: ScanPoint[];
  size: number;
  spacingKm: number;
  center: { lat: number; lng: number };
  business: GridBusiness;
  selected: ScanPoint | undefined;
  onSelect: (point: ScanPoint) => void;
  /** The tile server can't be reached. */
  onTilesFailed?: () => void;
}

/**
 * The scan on a map: one round marker per point with the rank inside,
 * coloured by band, and the business's pin. Markers are keyboard-focusable
 * (Enter opens the point). Kept apart so tests can mock it: jsdom can't run Leaflet.
 */
export default function HeatmapMap({ points, size, spacingKm, center, business, selected, onSelect, onTilesFailed }: HeatmapMapProps) {
  return (
    <div className="relative isolate z-0 h-[26rem] overflow-hidden rounded border sm:h-[30rem]">
      <MapContainer center={[center.lat, center.lng]} zoom={13} scrollWheelZoom={false} className="size-full" attributionControl>
        <MapTiles onFail={onTilesFailed} />
        <FitBounds center={center} size={size} spacingKm={spacingKm} />
        <Marker position={[business.lat, business.lng]} icon={businessIcon(business.title)} title={business.title} alt={`${business.title} (the business)`} zIndexOffset={-100} />
        {points.map((p) => {
          const isSelected = selected?.row === p.row && selected?.col === p.col;
          return (
            <Marker
              key={`${p.row}-${p.col}`}
              position={[p.lat, p.lng]}
              icon={pointIcon(p.rank, p.status, isSelected)}
              title={pointName(p)}
              alt={pointName(p)}
              zIndexOffset={isSelected ? 1000 : 0}
              eventHandlers={{ click: () => onSelect(p) }}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}
