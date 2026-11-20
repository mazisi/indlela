import { Ban, CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react';
import { formatNumber } from '@/features/search-console/lib/format';
import { cn } from '@/lib/utils';
import { SEVERITIES, SEVERITY } from '../../lib/severity';
import type { Audit, SeverityCounts } from '../../types';

/** "3 · 12 · 40" with each severity's icon and colour, read out as "3 critical, 12 warnings, 40 notices". */
export function SeverityCountsInline({ counts }: { counts: SeverityCounts }) {
  const spoken = SEVERITIES.map((s) => `${counts[s]} ${s === 'critical' ? 'critical' : `${s}${counts[s] === 1 ? '' : 's'}`}`).join(', ');
  return (
    <span className="inline-flex items-center gap-1" role="img" aria-label={spoken} title={spoken}>
      {SEVERITIES.map((s) => {
        const view = SEVERITY[s];
        const Icon = view.icon;
        const n = counts[s];
        return (
          <span
            key={s}
            className={cn('inline-flex min-w-10 items-center gap-1 rounded px-1.5 py-0.5 text-xs font-semibold tabular-nums', n > 0 ? cn(view.soft, view.text) : 'bg-muted/60 text-muted-foreground')}
          >
            <Icon className="size-3" aria-hidden />
            {formatNumber(n)}
          </span>
        );
      })}
    </span>
  );
}

const STATUS = {
  queued: { label: 'Queued', icon: Clock, tone: 'bg-accent text-primary' },
  crawling: { label: 'Crawling', icon: Loader2, tone: 'bg-accent text-primary' },
  analysing: { label: 'Analysing', icon: Loader2, tone: 'bg-accent text-primary' },
  done: { label: 'Done', icon: CheckCircle2, tone: 'bg-ok-soft text-ok' },
  failed: { label: 'Failed', icon: XCircle, tone: 'bg-bad-soft text-bad' },
  cancelled: { label: 'Cancelled', icon: Ban, tone: 'bg-muted text-muted-foreground' },
} as const;

export function AuditStatusBadge({ audit }: { audit: Pick<Audit, 'status' | 'error'> }) {
  const s = STATUS[audit.status];
  const Icon = s.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-2xs font-semibold', s.tone)} title={audit.error ?? undefined}>
      <Icon className={cn('size-3', (audit.status === 'crawling' || audit.status === 'analysing') && 'animate-spin')} aria-hidden />
      {s.label}
    </span>
  );
}
