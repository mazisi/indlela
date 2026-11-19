import type { LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export type StatTone = 'neutral' | 'ok' | 'warn' | 'bad';

const TONES: Record<StatTone, { bar: string; icon: string; value: string }> = {
  neutral: { bar: 'bg-primary/60', icon: 'bg-accent text-primary', value: '' },
  ok: { bar: 'bg-ok', icon: 'bg-ok-soft text-ok', value: '' },
  warn: { bar: 'bg-warn', icon: 'bg-warn-soft text-warn', value: 'text-warn' },
  bad: { bar: 'bg-bad', icon: 'bg-bad-soft text-bad', value: 'text-bad' },
};

interface Props {
  label: string;
  /** undefined: loading; null: not counted yet (its module isn't built), shown as "—". */
  value: string | number | null | undefined;
  hint: string;
  icon: LucideIcon;
  /** warn / bad when something needs action, ok when all is well. */
  tone?: StatTone;
  /** Makes the tile a button, e.g. opening the tab or filter it counts. */
  onClick?: () => void;
}

/** A page's summary tile : label, figure and hint, with a toned edge and icon. */
export function StatTile({ label, value, hint, icon: Icon, tone = 'neutral', onClick }: Props) {
  const t = TONES[tone];
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      className={cn(
        'relative overflow-hidden rounded border bg-card py-3 pl-5 pr-4 text-left shadow-xs',
        onClick && 'w-full transition-colors hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      )}
    >
      <span aria-hidden className={cn('absolute inset-y-0 left-0 w-1', t.bar)} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-2xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
          {value === undefined ? (
            <Skeleton className="mt-1.5 h-6 w-12 rounded" />
          ) : (
            <p className={cn('mt-1 text-xl font-bold leading-tight tabular-nums', value === null ? 'text-muted-foreground' : t.value)}>{value ?? '—'}</p>
          )}
          <p className="mt-0.5 truncate text-xs text-muted-foreground" title={hint}>
            {hint}
          </p>
        </div>
        <span aria-hidden className={cn('grid size-9 shrink-0 place-items-center rounded', t.icon)}>
          <Icon className="size-4.5" />
        </span>
      </div>
    </Tag>
  );
}
