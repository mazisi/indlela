import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/** A row of the form: how many fields side by side, and how tall each box is. */
export interface SkeletonRow {
  fields: 1 | 2 | 3;
  /** The input box: a field (default), a textarea or a file drop. */
  box?: 'input' | 'textarea' | 'drop';
}

const BOX = { input: 'h-9', textarea: 'h-20', drop: 'h-28' } as const;

/** A drawer form's loading state shaped like its fields: a label line over each box, row by row. */
export function FormSkeleton({ rows, label, className }: { rows: SkeletonRow[]; label: string; className?: string }) {
  return (
    <div className={cn('space-y-4 p-4', className)} aria-busy aria-label={label}>
      {rows.map((r, i) => (
        <div key={i} className={cn('grid gap-3', r.fields === 2 && 'sm:grid-cols-2', r.fields === 3 && 'sm:grid-cols-3')}>
          {Array.from({ length: r.fields }, (_, j) => (
            <div key={j} className="space-y-2">
              {r.box !== 'drop' && <Skeleton className="h-3.5 w-28" />}
              <Skeleton className={cn('w-full', BOX[r.box ?? 'input'])} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
