import 'leaflet/dist/leaflet.css';
import { MapContainer, Marker, useMapEvents } from 'react-leaflet';
import { gridPoints, roundCoord, type LatLng } from '../../lib/geometry';
import { FitBounds } from './FitBounds';
import { MapTiles } from './MapTiles';
import { businessIcon, previewIcon } from './leafletIcons';

export interface GridPreviewMapProps {
  center: LatLng;
  size: number;
  spacingKm: number;
  business: { title: string; lat: number; lng: number } | null;
  /** A click on the map moves the centre there. */
  onCenterChange?: (center: LatLng) => void;
}

function ClickToMove({ onMove }: { onMove: (center: LatLng) => void }) {
  useMapEvents({ click: (e) => onMove({ lat: roundCoord(e.latlng.lat), lng: roundCoord(e.latlng.lng) }) });
  return null;
}

/** The drawer's preview: the planned points around the centre and the business's pin. Mocked in tests (jsdom can't run Leaflet). */
export default function GridPreviewMap({ center, size, spacingKm, business, onCenterChange }: GridPreviewMapProps) {
  return (
    <div className="relative isolate z-0 h-60 overflow-hidden rounded border">
      <MapContainer center={[center.lat, center.lng]} zoom={13} scrollWheelZoom={false} className="size-full cursor-crosshair">
        <MapTiles />
        <FitBounds center={center} size={size} spacingKm={spacingKm} />
        {onCenterChange && <ClickToMove onMove={onCenterChange} />}
        {business && <Marker position={[business.lat, business.lng]} icon={businessIcon(business.title)} title={business.title} keyboard={false} interactive={false} />}
        {gridPoints(center, size, spacingKm).map((p) => (
          <Marker key={`${p.row}-${p.col}`} position={[p.lat, p.lng]} icon={previewIcon()} keyboard={false} interactive={false} />
        ))}
      </MapContainer>
    </div>
  );
}
