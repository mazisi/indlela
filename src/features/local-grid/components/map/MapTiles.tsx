import { useRef } from 'react';
import { TileLayer } from 'react-leaflet';
import { TILE_ATTRIBUTION, TILE_URL } from '../../lib/tiles';

/** After this many tile errors with none loaded, the tiles count as down. */
const FAILURES = 4;

/** The base map, with a callback when the tile server can't be reached (the page then falls back to the plain grid). */
export function MapTiles({ onFail }: { onFail?: () => void }) {
  const state = useRef({ loaded: 0, failed: 0, told: false });
  return (
    <TileLayer
      url={TILE_URL}
      attribution={TILE_ATTRIBUTION}
      eventHandlers={{
        tileload: () => {
          state.current.loaded += 1;
        },
        tileerror: () => {
          const s = state.current;
          s.failed += 1;
          if (!s.told && s.loaded === 0 && s.failed >= FAILURES) {
            s.told = true;
            onFail?.();
          }
        },
      }}
    />
  );
}
