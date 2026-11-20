import L from 'leaflet';
import { businessPinHtml, pointMarkerHtml, POINT_MARKER_SIZE, previewPointHtml } from '../../lib/markers';
import type { PointStatus } from '../../types';

/** divIcons, so no image assets are needed (Leaflet's default marker images don't survive bundling). */
export const pointIcon = (rank: number | null, status: PointStatus, selected: boolean) =>
  L.divIcon({ html: pointMarkerHtml(rank, status, selected), className: 'local-grid-marker', iconSize: [POINT_MARKER_SIZE, POINT_MARKER_SIZE], iconAnchor: [POINT_MARKER_SIZE / 2, POINT_MARKER_SIZE / 2] });

export const previewIcon = () => L.divIcon({ html: previewPointHtml(), className: 'local-grid-marker', iconSize: [10, 10], iconAnchor: [5, 5] });

export const businessIcon = (title: string) => L.divIcon({ html: businessPinHtml(title), className: 'local-grid-marker', iconSize: [26, 34], iconAnchor: [13, 33] });
