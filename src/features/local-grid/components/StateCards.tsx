import { Link } from 'react-router';
import { AlertCircle, CalendarClock, Crosshair, Globe, Grid3x3, MapPinned, PauseCircle, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StateCard, StateCardPoints } from '@/components/page/StateCard';
import { overviewPath, sitePath } from '../lib/permissions';

export function NoSitesState() {
  return (
    <StateCard icon={Globe} title="No sites yet">
      <p className="mt-1 max-w-md text-sm text-muted-foreground">Add your clients' websites first; you can then see where each business shows in the Google map pack across its area.</p>
      <Button asChild variant="outline" className="mt-5">
        <Link to="/dashboard/clients/sites">Go to Sites</Link>
      </Button>
    </StateCard>
  );
}

export function SiteNotFoundState() {
  return (
    <StateCard icon={AlertCircle} tone="bad" title="Site not found">
      <p className="mt-1 max-w-md text-sm text-muted-foreground">This site doesn't exist or you don't have access to it.</p>
      <Button asChild variant="outline" className="mt-5">
        <Link to={overviewPath()}>Back to Local grid</Link>
      </Button>
    </StateCard>
  );
}

export function GridNotFoundState({ siteId }: { siteId: number }) {
  return (
    <StateCard icon={AlertCircle} tone="bad" title="Grid not found">
      <p className="mt-1 max-w-md text-sm text-muted-foreground">This grid was deleted, or you don't have access to it.</p>
      <Button asChild variant="outline" className="mt-5">
        <Link to={sitePath(siteId)}>Back to the site's grids</Link>
      </Button>
    </StateCard>
  );
}

const WHAT_YOU_GET = [
  { icon: Grid3x3, title: 'Rank from every corner', text: 'We search from a grid of points across the area, e.g. 5×5 across Sandton, the way nearby customers do.' },
  { icon: MapPinned, title: 'A heatmap on the map', text: 'Green where the business is in the top 3 of the map pack, amber and red where it slips, grey where it is missing.' },
  { icon: Users, title: 'Who wins instead', text: 'See which competitors hold the top 3 across the grid, and where.' },
  { icon: CalendarClock, title: 'Weekly or monthly', text: 'Scan on demand or on a schedule, and compare each scan with the last.' },
];

export function NoGridsState({ canCreate, onCreate }: { canCreate: boolean; onCreate: () => void }) {
  return (
    <StateCard icon={Crosshair} title="Create your first local grid">
      <p className="mt-1 max-w-lg text-sm text-muted-foreground">
        Choose a search, the business's Google Maps listing and an area: we show where it appears in the map pack from every point.
      </p>
      <StateCardPoints points={WHAT_YOU_GET} />
      {canCreate ? (
        <Button className="mt-6" onClick={onCreate}>
          <Plus />
          New grid
        </Button>
      ) : (
        <p className="mt-6 rounded border border-dashed px-3 py-2 text-sm text-muted-foreground">No local grids for this site yet. Ask your account manager to set one up.</p>
      )}
    </StateCard>
  );
}

/** While scans are on hold: calm and neutral, nothing for the user to do. Never mentions why. */
export function ScansPausedNotice() {
  return (
    <section role="status" className="flex items-start gap-3 rounded border bg-card px-4 py-3 shadow-xs" aria-label="Local grid scans paused">
      <PauseCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Local grid scans are paused for now.</span> Your grids are safe and scans resume automatically.
      </p>
    </section>
  );
}
