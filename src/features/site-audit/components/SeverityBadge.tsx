import { cn } from '@/lib/utils';
import { SEVERITY } from '../lib/severity';
import type { Severity } from '../types';

/** Critical / Warning / Notice, with its icon (never colour alone). */
export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  const s = SEVERITY[severity];
  const Icon = s.icon;
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 text-2xs font-semibold uppercase tracking-wide', s.soft, s.text, s.border, className)}>
      <Icon className="size-3" aria-hidden />
      {s.label}
    </span>
  );
}

/** A small "N new" marker beside a count or URL. */
export function NewBadge({ count, className }: { count?: number; className?: string }) {
  return (
    <span className={cn('inline-flex shrink-0 items-center rounded bg-bad-soft px-1.5 py-0.5 text-2xs font-semibold text-bad', className)}>
      {count === undefined ? 'New' : `${count.toLocaleString('en-GB')} new`}
    </span>
  );
}
