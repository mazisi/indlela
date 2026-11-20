import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { StatTone } from '@/components/page/StatTile';
import { cn } from '@/lib/utils';

const TONES: Record<StatTone, { bar: string; icon: string; value: string }> = {
  neutral: { bar: 'bg-primary/60', icon: 'bg-accent text-primary', value: '' },
  ok: { bar: 'bg-ok', icon: 'bg-ok-soft text-ok', value: '' },
  warn: { bar: 'bg-warn', icon: 'bg-warn-soft text-warn', value: 'text-warn' },
  bad: { bar: 'bg-bad', icon: 'bg-bad-soft text-bad', value: 'text-bad' },
};

interface Props {
  label: string;
  value: ReactNode;
  /** Muted text after the figure, e.g. "of $50 cap". */
  suffix?: ReactNode;
  icon: LucideIcon;
  tone?: StatTone;
  /** Next to the label, e.g. a "Sandbox" badge. */
  badge?: ReactNode;
  /** Under the figure: a meter, a hint line. */
  children?: ReactNode;
  testId?: string;
}

/**
 * StatTile's look (toned edge, label, figure, icon) with room for a suffix,
 * a badge and a meter: the platform figures need more than a hint line.
 */
export function KpiTile({ label, value, suffix, icon: Icon, tone = 'neutral', badge, children, testId }: Props) {
  const t = TONES[tone];
  return (
    <section aria-label={label} data-tone={tone} data-testid={testId} className="relative overflow-hidden rounded border bg-card py-3 pl-5 pr-4 shadow-xs">
      <span aria-hidden className={cn('absolute inset-y-0 left-0 w-1', t.bar)} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-2xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
            {badge}
          </div>
          <p className="mt-1 flex flex-wrap items-baseline gap-x-1.5 leading-tight">
            <span className={cn('text-xl font-bold tabular-nums', t.value)}>{value}</span>
            {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
          </p>
          {children}
        </div>
        <span aria-hidden className={cn('grid size-9 shrink-0 place-items-center rounded', t.icon)}>
          <Icon className="size-4.5" />
        </span>
      </div>
    </section>
  );
}

/** A tile's muted line under the figure. */
export function KpiHint({ children }: { children: ReactNode }) {
  return <p className="mt-0.5 truncate text-xs text-muted-foreground">{children}</p>;
}
