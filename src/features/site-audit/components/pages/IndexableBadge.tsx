import { cn } from '@/lib/utils';

export function IndexableBadge({ indexable }: { indexable: boolean }) {
  return (
    <span className={cn('inline-flex rounded px-1.5 py-0.5 text-2xs font-semibold', indexable ? 'bg-ok-soft text-ok' : 'bg-muted text-muted-foreground')}>
      {indexable ? 'Indexable' : 'Not indexable'}
    </span>
  );
}
