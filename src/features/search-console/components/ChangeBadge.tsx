import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { describeChange, type Better } from '../lib/change';

const TONE = {
  good: 'bg-ok-soft text-ok',
  bad: 'bg-bad-soft text-bad',
  flat: 'bg-muted text-muted-foreground',
} as const;

interface Props {
  /** current − previous in the metric's units (or percent, for a relative change); null: nothing to compare. */
  value: number | null | undefined;
  better?: Better;
  /** Formats the size of the change (always given a positive number). */
  format: (abs: number) => string;
  /** The metric, for screen readers: "Clicks", "Position". */
  label: string;
  /** e.g. "vs previous period", appended to the screen-reader text. */
  context?: string;
  className?: string;
}

/**
 * A change pill: green with an up arrow when the metric got better, red with
 * a down arrow when it got worse. For position (lower is better) a drop from
 * 8 to 6 is an improvement, so it shows green and up.
 */
export function ChangeBadge({ value, better = 'higher', format, label, context, className }: Props) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return <span className={cn('text-xs text-muted-foreground', className)}>—</span>;
  }
  const view = describeChange(value, better);
  const Icon = view.arrow === 'up' ? ArrowUp : view.arrow === 'down' ? ArrowDown : Minus;
  const text = format(Math.abs(value));
  const spoken = view.tone === 'flat' ? `${label} unchanged` : `${label} ${view.word} ${text}`;
  return (
    <span
      role="img"
      aria-label={context ? `${spoken} ${context}` : spoken}
      data-tone={view.tone}
      className={cn('inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-semibold tabular-nums whitespace-nowrap', TONE[view.tone], className)}
    >
      <Icon className="size-3" aria-hidden />
      {view.tone === 'flat' ? '0' : text}
    </span>
  );
}
