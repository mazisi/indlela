export interface Coordinate {
  lat: number;
  lng: number;
}

const NUMBER = /^[-+]?\d{1,3}(\.\d+)?$/;

/**
 * "lat,lng" in decimal degrees, e.g. "-26.1076, 28.0567" (Sandton). Returns
 * null unless both are numbers in range (latitude −90…90, longitude −180…180).
 */
export function parseCoordinate(text: string): Coordinate | null {
  const parts = text.split(',').map((p) => p.trim());
  if (parts.length !== 2 || !parts.every((p) => NUMBER.test(p))) return null;
  const [lat, lng] = parts.map(Number);
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

/** The API's form: "lat,lng" without spaces, at most 7 decimals (about a centimetre). */
export const formatCoordinate = ({ lat, lng }: Coordinate) => `${+lat.toFixed(7)},${+lng.toFixed(7)}`;
