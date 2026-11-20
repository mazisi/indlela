import { useState } from 'react';
import { AlertCircle, CircleCheck, CircleAlert, CircleX, Gauge, Monitor, Smartphone } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Segmented } from '@/components/form/Segmented';
import { FormAlert } from '@/features/auth/components/FormAlert';
import { PageLink } from '@/features/search-console/components/reports/cells';
import { cn } from '@/lib/utils';
import { getApiErrorMessage } from '@/utils/formErrorHandler';
import { useVitals } from '../../hooks/useSiteAudit';
import { CATEGORY_LABELS, CATEGORY_TONE, THRESHOLDS, formatVital, vitalReadings, type VitalReading } from '../../lib/vitals';
import type { Audit, Strategy, VitalCategory, VitalsRow } from '../../types';
import { ScoreRing } from '../ScoreGauge';

const CATEGORY_ICON = { good: CircleCheck, 'needs-improvement': CircleAlert, poor: CircleX } as const;

/** Good / Needs improvement / Poor, with its icon. */
export function CategoryBadge({ category }: { category: VitalCategory }) {
  const Icon = CATEGORY_ICON[category];
  const tone = CATEGORY_TONE[category];
  return (
    <span data-category={category} className={cn('inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-2xs font-semibold', tone.soft, tone.text)}>
      <Icon className="size-3" aria-hidden />
      {CATEGORY_LABELS[category]}
    </span>
  );
}

/**
 * One metric: its value, its category and where it sits on Google's scale
 * (good | needs improvement | poor, the marker at the value).
 */
export function VitalMetric({ reading }: { reading: VitalReading }) {
  const [good, poor] = THRESHOLDS[reading.key];
  const max = poor * 1.5;
  const at = Math.min(100, (reading.value / max) * 100);
  return (
    <div className="min-w-0 rounded border bg-background/60 px-3 py-2" title={reading.hint}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">{reading.name}</span>
        <CategoryBadge category={reading.category} />
      </div>
      <p className="mt-1 text-lg font-bold leading-tight tabular-nums text-foreground" aria-label={`${reading.name} ${formatVital(reading.key, reading.value)}: ${CATEGORY_LABELS[reading.category]}`}>
        {formatVital(reading.key, reading.value)}
      </p>
      <div className="relative mt-2 flex h-1.5 gap-0.5" aria-hidden>
        <span className="h-full rounded-l-full bg-ok/70" style={{ width: `${(good / max) * 100}%` }} />
        <span className="h-full bg-warn/70" style={{ width: `${((poor - good) / max) * 100}%` }} />
        <span className="h-full flex-1 rounded-r-full bg-bad/70" />
        <span className="absolute -top-1 h-3.5 w-1 -translate-x-1/2 rounded-full bg-foreground ring-2 ring-card" style={{ left: `${at}%` }} />
      </div>
      <p className="mt-1 truncate text-2xs text-muted-foreground">
        Good ≤ {formatVital(reading.key, good)} · poor &gt; {formatVital(reading.key, poor)}
      </p>
    </div>
  );
}

function VitalsCard({ row }: { row: VitalsRow }) {
  const { source, readings } = vitalReadings(row);
  return (
    <li className="rounded border bg-card p-3 shadow-xs">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex min-w-0 items-center gap-3 lg:w-72 lg:shrink-0">
          {row.performanceScore !== null ? (
            <ScoreRing score={row.performanceScore} />
          ) : (
            <span className="grid size-14 shrink-0 place-items-center rounded-full border-4 border-muted text-xs text-muted-foreground">—</span>
          )}
          <div className="min-w-0">
            <PageLink url={row.url} className="max-w-full text-sm" />
            <p className="mt-0.5 text-xs text-muted-foreground">
              {source === 'field'
                ? row.field?.originFallback
                  ? 'Real-user data for the whole site (too few visits to this page)'
                  : 'Real-user data (Chrome, last 28 days)'
                : source === 'lab'
                  ? 'Lab data: too few visits for real-user data'
                  : 'No measurements'}
            </p>
          </div>
        </div>
        {row.error ? (
          <p className="flex items-start gap-2 text-sm text-bad">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {row.error}
          </p>
        ) : (
          <div className="grid flex-1 gap-2 sm:grid-cols-3">
            {readings.map((r) => (
              <VitalMetric key={r.key} reading={r} />
            ))}
          </div>
        )}
      </div>
    </li>
  );
}

/**
 * Core Web Vitals per key URL from PageSpeed Insights: performance score and
 * LCP / INP / CLS from real users (falling back to lab LCP / TBT / CLS), on
 * mobile or desktop.
 */
export function VitalsTab({ audit }: { audit: Audit }) {
  const [strategy, setStrategy] = useState<Strategy>('mobile');
  const vitals = useVitals(audit);

  if (audit.vitalsStatus === 'unavailable') {
    return (
      <div className="flex flex-col items-center gap-2 rounded border bg-card px-6 py-12 text-center shadow-xs">
        <span className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">
          <Gauge className="size-5" aria-hidden />
        </span>
        <p className="text-sm font-semibold">Core Web Vitals aren't available for this audit</p>
        <p className="max-w-md text-sm text-muted-foreground">{audit.vitalsMessage ?? 'PageSpeed Insights could not be reached.'}</p>
      </div>
    );
  }
  if (vitals.isError) {
    return (
      <FormAlert tone="error">
        <p>{getApiErrorMessage(vitals.error, 'We could not load Core Web Vitals.')}</p>
        <p>
          <button type="button" className="font-medium underline" onClick={() => vitals.refetch()}>
            Try again
          </button>
        </p>
      </FormAlert>
    );
  }

  const rows = (vitals.data ?? []).filter((r) => r.strategy === strategy);
  const pending = audit.vitalsStatus === 'pending';

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Segmented
          label="Device"
          value={strategy}
          onChange={setStrategy}
          options={[
            ['mobile', 'Mobile'],
            ['desktop', 'Desktop'],
          ]}
        />
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {strategy === 'mobile' ? <Smartphone className="size-3.5" aria-hidden /> : <Monitor className="size-3.5" aria-hidden />}
          Google ranks on mobile first. Thresholds: LCP 2.5 s / 4 s, INP 200 / 500 ms, CLS 0.1 / 0.25.
        </p>
      </div>
      {pending && (
        <div role="status" className="flex items-center gap-3 rounded border border-primary/25 bg-accent px-3 py-2 text-sm text-primary">
          <span className="h-1.5 w-24 overflow-hidden rounded-full bg-card" aria-hidden>
            <span className="block h-full w-1/3 animate-[sc-indeterminate_1.4s_ease-in-out_infinite] rounded-full bg-primary" />
          </span>
          Running PageSpeed checks on the key pages… results appear here as they finish.
        </div>
      )}
      {vitals.isPending ? (
        <VitalsSkeleton />
      ) : rows.length === 0 ? (
        !pending && <p className="rounded border border-dashed bg-card px-3 py-8 text-center text-sm text-muted-foreground">No {strategy} results for this audit.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <VitalsCard key={`${r.url}-${r.strategy}`} row={r} />
          ))}
        </ul>
      )}
    </div>
  );
}

function VitalsSkeleton() {
  return (
    <ul className="space-y-2" aria-busy="true" aria-label="Loading Core Web Vitals">
      {[0, 1, 2].map((i) => (
        <li key={i} className="flex flex-col gap-3 rounded border bg-card p-3 lg:flex-row lg:items-center">
          <div className="flex items-center gap-3 lg:w-72">
            <Skeleton className="size-14 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-36 rounded" />
              <Skeleton className="h-3 w-44 rounded" />
            </div>
          </div>
          <div className="grid flex-1 gap-2 sm:grid-cols-3">
            {[0, 1, 2].map((j) => (
              <div key={j} className="space-y-2 rounded border px-3 py-2">
                <Skeleton className="h-3 w-10 rounded" />
                <Skeleton className="h-5 w-14 rounded" />
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}
