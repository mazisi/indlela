import { Hash, PauseCircle, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber } from '@/features/search-console/lib/format';
import { cn } from '@/lib/utils';
import { checksNowLeft, keywordsLeft, usageLevel, usagePercent, type UsageLevel } from '../../lib/usage';
import type { RankUsage } from '../../types';

const BAR: Record<UsageLevel, string> = { ok: 'bg-primary', near: 'bg-warn', full: 'bg-bad' };
const VALUE: Record<UsageLevel, string> = { ok: 'text-foreground', near: 'text-warn', full: 'text-bad' };

const of = (used: number, limit: number) => `${formatNumber(used)} of ${formatNumber(limit)}`;

/** A thin track filled to the share used; amber from 80 %, red at the limit. */
export function Meter({ label, used, limit, className }: { label: string; used: number; limit: number; className?: string }) {
  const level = usageLevel(used, limit);
  const percent = usagePercent(used, limit);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={limit}
      aria-valuenow={Math.min(used, limit)}
      aria-valuetext={`${of(used, limit)} (${percent}%)`}
      data-level={level}
      className={cn('h-1.5 overflow-hidden rounded-full bg-muted', className)}
    >
      <div className={cn('h-full rounded-full transition-[width]', BAR[level])} style={{ width: `${percent}%` }} />
    </div>
  );
}

function keywordHint(usage: RankUsage): string {
  const level = usageLevel(usage.keywordsTracked, usage.keywordLimit);
  const left = keywordsLeft(usage);
  if (level === 'full') return 'Limit reached: remove keywords to make room for new ones.';
  if (level === 'near') return `Nearly there: ${formatNumber(left)} left.`;
  return `${formatNumber(left)} left to add.`;
}

/** Shown while checks are on hold: calm and neutral, nothing for the user to do. */
export function ChecksPausedNotice() {
  return (
    <section role="status" className="flex items-start gap-3 rounded border bg-card px-4 py-3 shadow-xs" aria-label="Rank checks paused">
      <PauseCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Rank checks are paused for now.</span> Your keywords are safe and checks resume automatically.
      </p>
    </section>
  );
}

/** The workspace's allowance: keywords tracked against the limit, and today's instant checks. */
export function UsageStrip({ usage }: { usage: RankUsage }) {
  const keywordLevel = usageLevel(usage.keywordsTracked, usage.keywordLimit);
  const checksLevel = usageLevel(usage.checksNowToday, usage.checkNowLimit);

  return (
    <div className="space-y-3">
      {usage.paused && <ChecksPausedNotice />}
      <section aria-label="Rank tracking usage" className="grid divide-y rounded border bg-card shadow-xs sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <div className="flex min-w-0 items-start gap-3 px-4 py-3">
          <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded bg-accent text-primary">
            <Hash className="size-4" />
          </span>
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Keywords tracked</p>
              <p className={cn('text-base font-bold leading-tight tabular-nums', VALUE[keywordLevel])} data-testid="keywords-tracked">
                {of(usage.keywordsTracked, usage.keywordLimit)}
              </p>
            </div>
            <Meter label="Keywords tracked" used={usage.keywordsTracked} limit={usage.keywordLimit} />
            <p className="text-xs text-muted-foreground">{keywordHint(usage)}</p>
          </div>
        </div>
        <div className="flex min-w-0 items-start gap-3 px-4 py-3">
          <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded bg-accent text-primary">
            <Zap className="size-4" />
          </span>
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Instant checks today</p>
              <p className={cn('text-base font-bold leading-tight tabular-nums', VALUE[checksLevel])} data-testid="checks-today">
                {of(usage.checksNowToday, usage.checkNowLimit)}
              </p>
            </div>
            <Meter label="Instant checks today" used={usage.checksNowToday} limit={usage.checkNowLimit} />
            <p className="text-xs text-muted-foreground">
              {checksNowLeft(usage) === 0 ? 'All used for today: they reset at midnight. Scheduled checks carry on as usual.' : 'Check now on a keyword for its position in a minute. Resets daily.'}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

/** The same figures in one line, for a site page's header. */
export function UsageStripCompact({ usage }: { usage: RankUsage }) {
  const keywordLevel = usageLevel(usage.keywordsTracked, usage.keywordLimit);
  const checksLevel = usageLevel(usage.checksNowToday, usage.checkNowLimit);
  return (
    <section aria-label="Rank tracking usage" className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded border bg-card px-3 py-1.5 text-xs shadow-xs">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Keywords</span>
        <span className={cn('font-semibold tabular-nums', VALUE[keywordLevel])} data-testid="keywords-tracked">
          {of(usage.keywordsTracked, usage.keywordLimit)}
        </span>
        <Meter label="Keywords tracked" used={usage.keywordsTracked} limit={usage.keywordLimit} className="w-16" />
      </div>
      <span aria-hidden className="hidden h-4 w-px bg-border sm:block" />
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">Instant checks today</span>
        <span className={cn('font-semibold tabular-nums', VALUE[checksLevel])} data-testid="checks-today">
          {of(usage.checksNowToday, usage.checkNowLimit)}
        </span>
      </div>
    </section>
  );
}

export function UsageStripSkeleton() {
  return (
    <div className="grid rounded border bg-card sm:grid-cols-2" aria-busy="true" aria-label="Loading usage">
      {['w-24', 'w-28'].map((w) => (
        <div key={w} className="flex gap-3 px-4 py-3">
          <Skeleton className="size-8 rounded" />
          <div className="flex-1 space-y-2">
            <div className="flex justify-between">
              <Skeleton className={cn('h-2.5 rounded', w)} />
              <Skeleton className="h-4 w-16 rounded" />
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
            <Skeleton className="h-3 w-36 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
