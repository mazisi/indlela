import type { ReactNode } from 'react';
import { ArrowDown } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { FormAlert } from '@/features/auth/components/FormAlert';
import { PageLink } from '@/features/search-console/components/reports/cells';
import { formatNumber } from '@/features/search-console/lib/format';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/formatDate';
import { getApiErrorMessage } from '@/utils/formErrorHandler';
import { useKeywordHistory } from '../../hooks/useRankTracking';
import { tallyFeatures, urlTimeline } from '../../lib/history';
import type { Device, KeywordHistoryPoint } from '../../types';
import { DeviceIcon, Rank } from '../cells';
import { SERP_FEATURES } from '../../lib/serpFeatures';
import { PositionHistoryChart } from './PositionHistoryChart';

/** What the drawer needs to know before the history loads (from a table row or a mover). */
export interface KeywordRef {
  id: number;
  keyword: string;
  locationName: string;
  device: Device;
}

export const HISTORY_DAYS = 90;

function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Stats({ points }: { points: KeywordHistoryPoint[] }) {
  const ranked = points.filter((p) => p.position);
  const last = points[points.length - 1];
  const best = ranked.length ? Math.min(...ranked.map((p) => p.position as number)) : null;
  const avg = ranked.length ? ranked.reduce((n, p) => n + (p.position as number), 0) / ranked.length : null;
  const items: [string, ReactNode][] = [
    ['Now', <Rank position={last?.position} />],
    ['Best', <Rank position={best} />],
    ['Average', avg === null ? '—' : <span className="font-semibold tabular-nums">{avg.toFixed(1)}</span>],
    ['In top 100', <span className="font-semibold tabular-nums">{`${ranked.length} / ${points.length}`}</span>],
  ];
  return (
    <dl className="grid grid-cols-4 gap-3 rounded border bg-card p-3">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
          <dd className="mt-0.5 text-base">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function UrlTimeline({ points }: { points: KeywordHistoryPoint[] }) {
  const spells = urlTimeline(points).reverse();
  if (spells.length === 0) return <p className="rounded border border-dashed px-3 py-2 text-sm text-muted-foreground">No page of the site ranked in this period.</p>;
  return (
    <ol className="divide-y rounded border bg-card" aria-label="Ranking URL, newest first">
      {spells.map((s, i) => (
        <li key={`${s.url}-${s.from}`} className="flex items-center gap-3 px-3 py-2">
          <span className={cn('size-2 shrink-0 rounded-full', i === 0 ? 'bg-primary' : 'bg-muted-foreground/40')} aria-hidden />
          <span className="min-w-0 flex-1">
            <PageLink url={s.url} className="max-w-full" />
            <span className="block text-xs text-muted-foreground tabular-nums">
              {s.from === s.to ? formatDate(s.from) : `${formatDate(s.from)} – ${formatDate(s.to)}`} · {formatNumber(s.checks)} {s.checks === 1 ? 'check' : 'checks'}
            </span>
          </span>
          {i === 0 && spells.length > 1 && <span className="rounded bg-warn-soft px-1.5 py-0.5 text-2xs font-semibold text-warn">Changed {formatDate(s.from)}</span>}
        </li>
      ))}
      {spells.length > 1 && (
        <li className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground">
          <ArrowDown className="size-3" aria-hidden />
          {spells.length - 1} {spells.length === 2 ? 'change' : 'changes'} of ranking page: Google swapping pages often means two pages compete for this search.
        </li>
      )}
    </ol>
  );
}

function FeatureSummary({ points }: { points: KeywordHistoryPoint[] }) {
  const tally = tallyFeatures(
    points,
    SERP_FEATURES.map((f) => f.key),
  );
  return (
    <ul className="grid gap-2 sm:grid-cols-3">
      {SERP_FEATURES.map(({ key, label, icon: Icon }) => {
        const t = tally[key];
        return (
          <li key={key} className="rounded border bg-card px-3 py-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold">
              <Icon className="size-3.5 text-primary" aria-hidden />
              {label}
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {t.present ? `Shown on ${t.present} of ${points.length} checks · you in ${t.ours}` : 'Not shown in this period'}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** A keyword's last 90 days: position chart, which page ranked when, and SERP features over the period. */
export function KeywordDetailSheet({ keyword, onClose }: { keyword: KeywordRef | undefined; onClose: () => void }) {
  const history = useKeywordHistory(keyword?.id);
  const points = history.data ?? [];

  return (
    <Sheet open={Boolean(keyword)} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-2xl">
        <SheetHeader className="border-b pr-10">
          <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Keyword history</p>
          <SheetTitle className="text-lg">{keyword?.keyword}</SheetTitle>
          <SheetDescription asChild>
            <div className="flex items-center gap-2 text-xs">
              {keyword && (
                <>
                  <span>{keyword.locationName}</span>
                  <DeviceIcon device={keyword.device} withLabel />
                  <span>· Last {HISTORY_DAYS} days</span>
                </>
              )}
            </div>
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-6 overflow-y-auto p-4">
          {history.isError ? (
            <FormAlert tone="error">
              <p>{getApiErrorMessage(history.error, 'We could not load this keyword’s history.')}</p>
            </FormAlert>
          ) : history.isPending ? (
            <DetailSkeleton />
          ) : points.length === 0 ? (
            <p className="rounded border border-dashed px-3 py-10 text-center text-sm text-muted-foreground">No checks yet: the history starts after the first check.</p>
          ) : (
            <>
              <Stats points={points} />
              <Section title="Position" aside={<span className="text-xs text-muted-foreground">Higher is better · gaps: not in the top 100</span>}>
                <div className="rounded border bg-card px-2 pb-2 pt-3">
                  <PositionHistoryChart points={points} />
                </div>
              </Section>
              <Section title="Ranking URL">
                <UrlTimeline points={points} />
              </Section>
              <Section title="SERP features">
                <FeatureSummary points={points} />
              </Section>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading the history">
      <div className="grid grid-cols-4 gap-3 rounded border bg-card p-3">
        {['w-6', 'w-6', 'w-8', 'w-12'].map((w, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-2.5 w-12 rounded" />
            <Skeleton className={cn('h-4 rounded', w)} />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-20 rounded" />
        <div className="relative h-52 rounded border bg-card">
          {[0, 1, 2].map((i) => (
            <div key={i} className="absolute inset-x-8 border-t border-muted" style={{ top: `${20 + i * 30}%` }} />
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24 rounded" />
        {[0, 1].map((i) => (
          <div key={i} className="flex gap-3 rounded border bg-card p-3">
            <Skeleton className="size-2 rounded-full" />
            <Skeleton className="h-3.5 w-48 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
