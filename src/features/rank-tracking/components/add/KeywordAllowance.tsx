import { AlertTriangle, Hash } from 'lucide-react';
import { formatNumber } from '@/features/search-console/lib/format';
import { cn } from '@/lib/utils';
import { keywordsLeft, keywordsToAdd } from '../../lib/usage';
import type { RankUsage } from '../../types';

const count = (n: number, one: string) => `${formatNumber(n)} ${n === 1 ? one : `${one}s`}`;

interface Props {
  keywords: number;
  locations: number;
  devices: number;
  /** undefined while the usage loads: the sum shows without the allowance. */
  usage: RankUsage | undefined;
}

/** What this Add counts against the workspace's keyword limit, as you type; a warning once it doesn't fit. */
export function KeywordAllowance({ keywords, locations, devices, usage }: Props) {
  const adds = keywordsToAdd(keywords, locations, devices);
  const left = usage ? keywordsLeft(usage) : undefined;
  const over = left !== undefined && adds > left;

  return (
    <div
      className={cn('flex gap-3 rounded border p-3', over ? 'border-warn/40 bg-warn-soft/60' : 'border-primary/20 bg-accent/50')}
      role={over ? 'alert' : undefined}
      aria-live="polite"
      data-testid="keyword-allowance"
      data-over={over || undefined}
    >
      {over ? <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden /> : <Hash className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />}
      <div className="min-w-0 space-y-0.5 text-sm">
        <p className="tabular-nums">
          This adds <span className="font-semibold">{count(adds, 'keyword')}</span> ({formatNumber(keywords)} × {count(locations, 'location')} × {count(devices, 'device')}).
          {usage && left !== undefined && (
            <>
              {' '}
              You have{' '}
              <span className={cn('font-semibold', over && 'text-warn')}>
                {formatNumber(left)} of {formatNumber(usage.keywordLimit)}
              </span>{' '}
              left.
            </>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {over
            ? 'That is more than you have left. Remove some keywords, locations or devices, or delete keywords you no longer need.'
            : 'Each keyword is tracked in every location, on every device. Ones already tracked are skipped and not counted.'}
        </p>
      </div>
    </div>
  );
}
