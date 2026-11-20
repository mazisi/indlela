import { Skeleton } from '@/components/ui/skeleton';
import { TileSkeleton } from '@/components/skeletons/TileSkeleton';
import { DataTableSkeleton, type DataColumn } from '@/components/table/DataTable';

const COMPETITOR_COLUMNS: DataColumn<{ id: number }, string>[] = [
  { label: 'Business', skeleton: 'w-44', cell: () => null },
  { label: 'In the top 3 at', skeleton: 'w-20', align: 'right', cell: () => null },
  { label: 'Found at', skeleton: 'w-20', align: 'right', cell: () => null },
  { label: 'Avg rank', skeleton: 'w-8', align: 'right', cell: () => null },
];

/** The heatmap card while it loads: title, view toggle, legend dots and the map's frame. */
export function HeatmapSkeleton() {
  return (
    <div className="space-y-3 rounded border bg-card p-4" aria-busy="true" aria-label="Loading the heatmap">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-3 w-72 rounded" />
        </div>
        <Skeleton className="h-9 w-28 rounded" />
      </div>
      <div className="flex gap-4">
        {['w-10', 'w-12', 'w-12', 'w-24'].map((w, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <Skeleton className="size-3 rounded-full" />
            <Skeleton className={`h-3 rounded ${w}`} />
          </span>
        ))}
      </div>
      <Skeleton className="h-[26rem] w-full rounded sm:h-[30rem]" />
    </div>
  );
}

/** The grid page while it loads: tiles, heatmap and the competitors table, in their shapes. */
export function GridDetailSkeleton() {
  return (
    <div className="space-y-4">
      <TileSkeleton count={4} label="Loading the figures" />
      <HeatmapSkeleton />
      <DataTableSkeleton columns={COMPETITOR_COLUMNS} rows={5} label="Loading competitors" selectable={false} actions={false} />
    </div>
  );
}
