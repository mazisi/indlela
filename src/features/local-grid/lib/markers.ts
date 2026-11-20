import type { PointStatus } from '../types';
import { RANK_TONES, rankLabel, rankTone } from './rank';

/** Marker diameter on the heatmap, in px. */
export const POINT_MARKER_SIZE = 30;

const escape = (s: string) => s.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);

/** The HTML inside a heatmap point's Leaflet divIcon: a round, coloured badge with the rank. */
export function pointMarkerHtml(rank: number | null, status: PointStatus, selected = false): string {
  const tone = RANK_TONES[status === 'failed' ? 'none' : rankTone(rank, status)];
  const ring = selected ? '0 0 0 3px var(--card), 0 0 0 5px var(--primary)' : '0 1px 3px rgba(0,0,0,.35)';
  return (
    `<span data-tone="${rankTone(rank, status)}" style="display:grid;place-items:center;width:${POINT_MARKER_SIZE}px;height:${POINT_MARKER_SIZE}px;` +
    `border-radius:9999px;border:2px solid #fff;box-shadow:${ring};background:${tone.fill};color:${tone.ink};` +
    `font:700 12px/1 var(--font-sans, system-ui);font-variant-numeric:tabular-nums">${escape(rankLabel(rank, status))}</span>`
  );
}

/** A small grey dot for a planned point (the drawer's preview). */
export const previewPointHtml = () =>
  '<span style="display:block;width:10px;height:10px;border-radius:9999px;background:var(--primary);border:2px solid #fff;box-shadow:0 1px 2px rgba(0,0,0,.35)"></span>';

/** The tracked business: a pin, so it reads apart from the round points. */
export function businessPinHtml(title: string): string {
  return (
    `<span title="${escape(title)}" style="display:block;width:26px;height:34px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.4))">` +
    '<svg viewBox="0 0 26 34" width="26" height="34" aria-hidden="true"><path d="M13 1C6.4 1 1 6.3 1 12.9 1 21.8 13 33 13 33s12-11.2 12-20.1C25 6.3 19.6 1 13 1z" fill="var(--primary)" stroke="#fff" stroke-width="2"/>' +
    '<circle cx="13" cy="13" r="4.5" fill="#fff"/></svg></span>'
  );
}
