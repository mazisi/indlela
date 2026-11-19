import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface Props {
  /** What is loading, for screen readers, e.g. "the audit issues". */
  label: string;
  items?: number;
  /** A toolbar above the list: a title on the left, a button on the right. */
  toolbar?: boolean;
  /** Each entry's right-hand pill (status). */
  pill?: boolean;
  className?: string;
}

/** A list of records loading (issues, keywords, …): a bordered card per entry with a title line, a muted line and a status pill. */
export function ListSkeleton({ label, items = 3, toolbar = false, pill = true, className }: Props) {
  return (
    <div className={cn('space-y-2', className)} aria-busy aria-label={label}>
      {toolbar && (
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-8 w-28 rounded" />
        </div>
      )}
      {Array.from({ length: items }, (_, i) => (
        <div key={i} className="flex items-start gap-3 rounded border bg-card px-3 py-2.5">
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className={cn('h-4 rounded', ['w-48', 'w-40', 'w-56'][i % 3])} />
            <Skeleton className={cn('h-3 rounded', ['w-64', 'w-52', 'w-44'][i % 3])} />
          </div>
          {pill && <Skeleton className="h-5 w-20 rounded" />}
        </div>
      ))}
    </div>
  );
}
