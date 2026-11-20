import { useState, type ReactNode } from 'react';
import { StatTile } from '@/components/page/StatTile';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber } from '@/features/search-console/lib/format';
import { formatDateTime } from '@/utils/formatDate';
import { SEVERITIES, SEVERITY } from '../lib/severity';
import type { Audit, ChangeFilter } from '../types';
import { ComparisonBanner, ComparisonSheet } from './Comparison';
import { HealthGauge } from './ScoreGauge';

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 truncate text-sm font-medium tabular-nums">{children}</dd>
    </div>
  );
}

const TILE_TONE = { critical: 'bad', warning: 'warn', notice: 'neutral' } as const;

interface Props {
  audit: Audit;
  /** When the audit it is compared with finished, if known. */
  previousDate?: string | null;
  /** Opens the Issues tab (a severity tile was clicked). */
  onShowIssues: () => void;
}

/** The audit at a glance: health gauge, when and how much was crawled, issues by severity and what changed. */
export function AuditSummary({ audit, previousDate, onShowIssues }: Props) {
  const [changes, setChanges] = useState<ChangeFilter | null>(null);
  return (
    <div className="grid gap-3 lg:grid-cols-[30rem_minmax(0,1fr)]">
      <section aria-label="Health score" className="flex items-center gap-5 rounded border bg-card px-4 py-3 shadow-xs">
        <HealthGauge score={audit.healthScore ?? 0} />
        <dl className="grid min-w-0 flex-1 gap-2">
          <Fact label="Last crawled">{audit.finishedAt ? formatDateTime(audit.finishedAt) : '—'}</Fact>
          <Fact label="Pages crawled">
            {formatNumber(audit.pagesCrawled)}
            <span className="font-normal text-muted-foreground"> of {formatNumber(audit.pageLimit)} max</span>
          </Fact>
          <Fact label="Run">{audit.trigger === 'scheduled' ? 'On schedule' : `By ${audit.triggeredBy?.name ?? 'a user'}`}</Fact>
        </dl>
      </section>
      <div className="flex min-w-0 flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-3">
          {SEVERITIES.map((s) => (
            <StatTile
              key={s}
              label={SEVERITY[s].plural}
              value={formatNumber(audit.counts[s])}
              hint={audit.counts[s] ? SEVERITY[s].hint : 'None found'}
              icon={SEVERITY[s].icon}
              tone={audit.counts[s] ? TILE_TONE[s] : 'ok'}
              onClick={onShowIssues}
            />
          ))}
        </div>
        {audit.comparison ? (
          <>
            <ComparisonBanner comparison={audit.comparison} previousDate={previousDate} onOpen={setChanges} />
            <ComparisonSheet auditId={audit.id} comparison={audit.comparison} previousDate={previousDate} filter={changes} onFilterChange={setChanges} />
          </>
        ) : (
          <p className="rounded border border-dashed bg-card px-3 py-2.5 text-sm text-muted-foreground">
            This is the site's first audit: the next one shows what was fixed and what is new.
          </p>
        )}
      </div>
    </div>
  );
}

export function AuditSummarySkeleton() {
  return (
    <div className="grid gap-3 lg:grid-cols-[30rem_minmax(0,1fr)]" aria-busy="true" aria-label="Loading the audit">
      <div className="flex items-center gap-5 rounded border bg-card px-4 py-3">
        <Skeleton className="h-24 w-52 rounded-t-full" />
        <div className="flex-1 space-y-3">
          {['w-28', 'w-20', 'w-24'].map((w) => (
            <div key={w} className="space-y-1">
              <Skeleton className="h-2.5 w-16 rounded" />
              <Skeleton className={`h-3.5 rounded ${w}`} />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-2 rounded border bg-card p-3">
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-6 w-10 rounded" />
              <Skeleton className="h-3 w-32 rounded" />
            </div>
          ))}
        </div>
        <Skeleton className="h-11 w-full rounded" />
      </div>
    </div>
  );
}
