import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/** Stat tiles loading (overview pages, dashboard): a label, the big number and a muted line per tile. */
export function TileSkeleton({ count, label, className }: { count: number; label: string; className?: string }) {
  return (
    <div className={cn('grid gap-3 sm:grid-cols-2 lg:grid-cols-4', className)} aria-busy aria-label={label}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="space-y-2 rounded border bg-card p-3">
          <Skeleton className={cn('h-3 rounded', ['w-24', 'w-20', 'w-28', 'w-16'][i % 4])} />
          <Skeleton className="h-6 w-12 rounded" />
          <Skeleton className={cn('h-3 rounded', ['w-32', 'w-28', 'w-36', 'w-24'][i % 4])} />
        </div>
      ))}
    </div>
  );
}
