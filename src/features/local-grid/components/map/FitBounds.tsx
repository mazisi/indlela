import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { gridBounds, type LatLng } from '../../lib/geometry';

/** Keeps the whole grid in view when its centre, size or spacing change. */
export function FitBounds({ center, size, spacingKm }: { center: LatLng; size: number; spacingKm: number }) {
  const map = useMap();
  const { lat, lng } = center;
  useEffect(() => {
    map.fitBounds(gridBounds({ lat, lng }, size, spacingKm), { padding: [12, 12] });
  }, [map, lat, lng, size, spacingKm]);
  return null;
}
