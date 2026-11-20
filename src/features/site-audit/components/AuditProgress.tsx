import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { crawlPercent, progressLabel } from '../lib/auditStatus';
import type { Audit } from '../types';

/**
 * A running audit: "Crawling… 143 / 500 pages" over a progress bar
 * (indeterminate while queued or analysing).
 */
export function AuditProgress({ audit, compact = false, className }: { audit: Audit; compact?: boolean; className?: string }) {
  const percent = crawlPercent(audit);
  const label = progressLabel(audit);
  return (
    <div className={cn('min-w-0', compact ? 'w-40' : 'w-full', className)}>
      <p role="status" className={cn('flex items-center gap-1.5 font-medium text-primary', compact ? 'text-xs' : 'text-sm')}>
        <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
        <span className="truncate">{label}</span>
      </p>
      <div
        className={cn('mt-1.5 overflow-hidden rounded-full bg-accent', compact ? 'h-1' : 'h-1.5')}
        role="progressbar"
        aria-label="Audit progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent ?? undefined}
        aria-valuetext={label}
      >
        {percent === null ? (
          <div className="h-full w-1/3 animate-[sc-indeterminate_1.4s_ease-in-out_infinite] rounded-full bg-primary" />
        ) : (
          <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${Math.max(percent, 2)}%` }} />
        )}
      </div>
    </div>
  );
}
