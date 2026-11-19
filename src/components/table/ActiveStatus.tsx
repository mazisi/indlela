import { cn } from '@/lib/utils';

/** Active / Inactive pill for settings lists (banks, departments, …); `labels` renames it, e.g. In use / Retired. */
export function ActiveStatus({ active, labels = ['Active', 'Inactive'] }: { active: boolean; labels?: [string, string] }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-2xs font-semibold',
        active ? 'bg-ok-soft text-ok' : 'bg-secondary text-muted-foreground',
      )}
    >
      <span className={cn('size-1.5 rounded-full', active ? 'bg-ok' : 'bg-muted-foreground/60')} aria-hidden />
      {active ? labels[0] : labels[1]}
    </span>
  );
}
