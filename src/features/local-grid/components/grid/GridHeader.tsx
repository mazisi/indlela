import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { ChevronRight, MapPin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { StickyBar } from '@/components/page/StickyBar';
import { gridShape } from '../../lib/labels';
import { overviewPath, sitePath } from '../../lib/permissions';
import type { Grid, LocalGridSite } from '../../types';
import { DeviceTag, ScheduleCell } from '../cells';

/** The grid page's header: breadcrumb (Local grid › client › site › keyword), the keyword, its business and shape, and the actions. */
export function GridHeader({ siteId, site, grid, actions }: { siteId: number; site: LocalGridSite | undefined; grid: Grid | undefined; actions?: ReactNode }) {
  return (
    <div className="space-y-3">
      <nav aria-label="Breadcrumb">
        <ol className="flex min-w-0 flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <li>
            <Link to={overviewPath()} className="font-medium hover:text-primary">
              Local grid
            </Link>
          </li>
          {site?.client && (
            <li className="flex items-center gap-1">
              <ChevronRight className="size-3.5 opacity-60" aria-hidden />
              <span>{site.client.name}</span>
            </li>
          )}
          <li className="flex items-center gap-1">
            <ChevronRight className="size-3.5 opacity-60" aria-hidden />
            <Link to={sitePath(siteId)} className="font-medium hover:text-primary">
              {site?.name ?? 'Site'}
            </Link>
          </li>
          {grid && (
            <li className="flex min-w-0 items-center gap-1">
              <ChevronRight className="size-3.5 opacity-60" aria-hidden />
              <span aria-current="page" className="truncate font-medium text-foreground">
                {grid.keyword}
              </span>
            </li>
          )}
        </ol>
      </nav>

      <StickyBar className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded border border-primary/15 bg-accent text-primary" aria-hidden>
            <MapPin className="size-5" />
          </span>
          <div className="min-w-0">
            {grid ? (
              <h1 className="truncate text-xl font-semibold leading-tight text-foreground">{grid.keyword}</h1>
            ) : (
              <>
                <h1 className="sr-only">Loading…</h1>
                <Skeleton className="h-6 w-48 rounded" />
              </>
            )}
            {grid ? (
              <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="truncate font-medium text-foreground" title={grid.business.address ?? undefined}>
                  {grid.business.title}
                </span>
                <span className="tabular-nums">{gridShape(grid.size, grid.spacingKm)}</span>
                <DeviceTag device={grid.device} />
                <ScheduleCell grid={grid} />
              </div>
            ) : (
              <Skeleton className="mt-1.5 h-3.5 w-72 rounded" />
            )}
          </div>
        </div>
        {actions}
      </StickyBar>
    </div>
  );
}
