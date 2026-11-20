import { Crosshair, MapPinned, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatLatLng, gridSpanKm, pointCount, samePlace, type LatLng } from '../../lib/geometry';
import { formatKm } from '../../lib/labels';
import type { GridBusiness } from '../../types';
import GridPreviewMap from '../map/GridPreviewMap';

interface Props {
  center: LatLng | null;
  size: number;
  spacingKm: number;
  business: GridBusiness | null;
  onCenterChange: (center: LatLng) => void;
  error?: string;
}

/** The area the grid covers: a map preview of its points (click to move the centre), the centre and the coverage. */
export function GridArea({ center, size, spacingKm, business, onCenterChange, error }: Props) {
  const span = formatKm(gridSpanKm(size, spacingKm));
  return (
    <section className="space-y-1.5" aria-labelledby="grid-area-title">
      <div className="flex items-center justify-between gap-2">
        <h3 id="grid-area-title" className="text-sm font-medium text-foreground">
          Area
        </h3>
        <span className="text-xs tabular-nums text-muted-foreground" data-testid="grid-coverage">
          {pointCount(size)} points covering {span} × {span}
        </span>
      </div>
      {center ? (
        <>
          <GridPreviewMap center={center} size={size} spacingKm={spacingKm} business={business} onCenterChange={onCenterChange} />
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Crosshair className="size-3.5" aria-hidden />
              Centre <span className="font-medium tabular-nums text-foreground" data-testid="grid-centre">{formatLatLng(center)}</span> · click the map to move it
            </span>
            {business && !samePlace(center, business) && (
              <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => onCenterChange({ lat: business.lat, lng: business.lng })}>
                <RotateCcw className="size-3" />
                Centre on the business
              </Button>
            )}
          </div>
        </>
      ) : (
        <div className="grid h-60 place-items-center rounded border border-dashed bg-muted/30 px-6 text-center">
          <div className="space-y-1">
            <MapPinned className="mx-auto size-6 text-muted-foreground" aria-hidden />
            <p className="text-sm font-medium">Choose the business first</p>
            <p className="text-xs text-muted-foreground">The grid is centred on its listing; you can then move it.</p>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
