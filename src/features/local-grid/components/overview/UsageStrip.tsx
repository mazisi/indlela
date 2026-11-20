import type { LucideIcon } from 'lucide-react';
import { Grid3x3, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Meter } from '@/features/rank-tracking/components/overview/UsageStrip';
import { formatNumber } from '@/features/search-console/lib/format';
import { cn } from '@/lib/utils';
import { left, usageLevel, type UsageLevel } from '../../lib/usage';
import type { Allowance, LocalGridUsage } from '../../types';
import { ScansPausedNotice } from '../StateCards';

const VALUE: Record<UsageLevel, string> = { ok: 'text-foreground', near: 'text-warn', full: 'text-bad' };

const of = (a: Allowance) => `${formatNumber(a.used)} of ${formatNumber(a.limit)}`;

function gridsHint(a: Allowance): string {
  const level = usageLevel(a.used, a.limit);
  if (level === 'full') return 'Limit reached: pause or delete a grid to make room.';
  if (level === 'near') return `Nearly there: ${formatNumber(left(a))} left.`;
  return `${formatNumber(left(a))} left to create.`;
}

function Block({ icon: Icon, label, testId, allowance, hint }: { icon: LucideIcon; label: string; testId: string; allowance: Allowance; hint: string }) {
  const level = usageLevel(allowance.used, allowance.limit);
  return (
    <div className="flex min-w-0 items-start gap-3 px-4 py-3">
      <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded bg-accent text-primary">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className={cn('text-base font-bold leading-tight tabular-nums', VALUE[level])} data-testid={testId}>
            {of(allowance)}
          </p>
        </div>
        <Meter label={label} used={allowance.used} limit={allowance.limit} />
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}

/** The workspace's allowance: active grids against the limit, and today's manual scans. */
export function UsageStrip({ usage }: { usage: LocalGridUsage }) {
  return (
    <div className="space-y-3">
      {usage.paused && <ScansPausedNotice />}
      <section aria-label="Local grid usage" className="grid divide-y rounded border bg-card shadow-xs sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <Block icon={Grid3x3} label="Active grids" testId="grids-used" allowance={usage.grids} hint={gridsHint(usage.grids)} />
        <Block
          icon={Zap}
          label="Scans today"
          testId="scans-today"
          allowance={usage.scansToday}
          hint={left(usage.scansToday) === 0 ? 'All used for today: they reset at midnight. Scheduled scans carry on as usual.' : 'Scan now on a grid for a fresh heatmap in about a minute. Resets daily.'}
        />
      </section>
    </div>
  );
}

/** The same figures in one line, for a site page's header. */
export function UsageStripCompact({ usage }: { usage: LocalGridUsage }) {
  const items = [
    { label: 'Grids', testId: 'grids-used', a: usage.grids },
    { label: 'Scans today', testId: 'scans-today', a: usage.scansToday },
  ];
  return (
    <section aria-label="Local grid usage" className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded border bg-card px-3 py-1.5 text-xs shadow-xs">
      {items.map(({ label, testId, a }, i) => (
        <div key={label} className="flex items-center gap-2">
          {i > 0 && <span aria-hidden className="mr-2 hidden h-4 w-px bg-border sm:block" />}
          <span className="text-muted-foreground">{label}</span>
          <span className={cn('font-semibold tabular-nums', VALUE[usageLevel(a.used, a.limit)])} data-testid={testId}>
            {of(a)}
          </span>
        </div>
      ))}
    </section>
  );
}

export function UsageStripSkeleton() {
  return (
    <div className="grid rounded border bg-card sm:grid-cols-2" aria-busy="true" aria-label="Loading usage">
      {['w-20', 'w-16'].map((w) => (
        <div key={w} className="flex gap-3 px-4 py-3">
          <Skeleton className="size-8 rounded" />
          <div className="flex-1 space-y-2">
            <div className="flex justify-between">
              <Skeleton className={cn('h-2.5 rounded', w)} />
              <Skeleton className="h-4 w-14 rounded" />
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
            <Skeleton className="h-3 w-36 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
