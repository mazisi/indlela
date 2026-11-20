import { Activity, Hash, Wallet, Zap } from 'lucide-react';
import type { StatTone } from '@/components/page/StatTile';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber } from '@/features/search-console/lib/format';
import { cn } from '@/lib/utils';
import { formatUsd, formatUsdShort, spendLevel, type SpendLevel } from '../lib/format';
import type { PlatformUsage } from '../types';
import { KpiHint, KpiTile } from './KpiTile';

const TONE: Record<SpendLevel, StatTone> = { none: 'neutral', ok: 'neutral', near: 'warn', over: 'bad' };
const BAR: Record<SpendLevel, string> = { none: 'bg-primary', ok: 'bg-primary', near: 'bg-warn', over: 'bg-bad' };

const plural = (n: number, one: string, many = `${one}s`) => `${formatNumber(n)} ${n === 1 ? one : many}`;

/** This month's spend against the cap: charged plus pending (checks posted, not answered yet), the figure the cap uses. */
function SpendTile({ usage }: { usage: PlatformUsage }) {
  const { thisMonth, pending, cap, capUsedPct } = usage.spend;
  const level = spendLevel(capUsedPct, cap);
  const pct = Math.max(0, Math.min(100, capUsedPct ?? 0));
  return (
    <KpiTile label="Spend this month" value={formatUsd(thisMonth)} suffix={cap ? `of ${formatUsdShort(cap)} cap` : 'no cap'} icon={Wallet} tone={TONE[level]} testId="kpi-spend">
      {cap ? (
        <div
          role="progressbar"
          aria-label="Spend against the monthly cap"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pct)}
          aria-valuetext={`${formatUsd(thisMonth)} of ${formatUsdShort(cap)} (${Math.round(capUsedPct ?? 0)}%)`}
          data-level={level}
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
        >
          <div className={cn('h-full rounded-full transition-[width]', BAR[level])} style={{ width: `${pct}%` }} />
        </div>
      ) : null}
      <KpiHint>
        {pending > 0 ? `Incl. ${formatUsd(pending)} pending` : 'Nothing pending'}
        {level === 'over' ? ' · cap reached, checks paused' : level === 'near' ? ' · nearing the cap' : ''}
      </KpiHint>
    </KpiTile>
  );
}

function BalanceTile({ usage }: { usage: PlatformUsage }) {
  const { configured, sandbox, balance } = usage.provider;
  const badge = configured && sandbox ? <span className="rounded border border-warn/40 bg-warn-soft px-1.5 py-px text-2xs font-semibold text-warn">Sandbox</span> : null;
  if (!configured) {
    return (
      <KpiTile label="DataForSEO balance" value="Not configured" icon={Zap} tone="bad" testId="kpi-balance">
        <KpiHint>No credentials: rank checks are paused.</KpiHint>
      </KpiTile>
    );
  }
  return (
    <KpiTile label="DataForSEO balance" value={balance === null ? '—' : formatUsd(balance)} icon={Zap} badge={badge} testId="kpi-balance">
      <KpiHint>{sandbox ? 'Sandbox: free sample data, not billed' : balance === null ? "Couldn't read the balance just now" : 'Prepaid, on the live account'}</KpiHint>
    </KpiTile>
  );
}

/** The four headline figures: spend, provider balance, keywords and checks. */
export function UsageKpis({ usage }: { usage: PlatformUsage }) {
  const { totals } = usage;
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <SpendTile usage={usage} />
      <BalanceTile usage={usage} />
      <KpiTile label="Keywords tracked" value={formatNumber(totals.keywordsTracked)} icon={Hash} testId="kpi-keywords">
        <KpiHint>
          in {plural(totals.activeWorkspaces, 'active workspace')} of {formatNumber(totals.workspaces)}
        </KpiHint>
      </KpiTile>
      <KpiTile label="Checks this month" value={formatNumber(totals.checksThisMonth)} icon={Activity} testId="kpi-checks">
        <KpiHint>{plural(totals.liveChecksThisMonth, 'live check')} (Check now)</KpiHint>
      </KpiTile>
    </div>
  );
}

/** The tiles loading: label, figure, a meter on the spend tile, a hint line, the icon. */
export function UsageKpisSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true" aria-label="Loading the usage figures">
      {['w-28', 'w-32', 'w-24', 'w-28'].map((w, i) => (
        <div key={i} className="flex items-start justify-between gap-3 rounded border bg-card py-3 pl-5 pr-4">
          <div className="flex-1 space-y-2">
            <Skeleton className={cn('h-2.5 rounded', w)} />
            <Skeleton className="h-6 w-20 rounded" />
            {i === 0 && <Skeleton className="h-1.5 w-full rounded-full" />}
            <Skeleton className="h-3 w-32 rounded" />
          </div>
          <Skeleton className="size-9 rounded" />
        </div>
      ))}
    </div>
  );
}
