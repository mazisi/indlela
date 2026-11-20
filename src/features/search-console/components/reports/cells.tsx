import type { ReactNode } from 'react';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatNumber, pagePath } from '../../lib/format';
import type { MonthlyClicks } from '../../types';

/** A page URL shown as its path, opening the live page in a new tab. */
export function PageLink({ url, className }: { url: string; className?: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer noopener"
      title={url}
      className={cn('inline-flex max-w-full items-center gap-1 font-mono text-xs text-primary hover:underline', className)}
    >
      <span className="truncate">{pagePath(url)}</span>
      <ExternalLink className="size-3 shrink-0" aria-hidden />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

/** A value with its change pill beside it, right-aligned in a figures column. */
export function WithChange({ value, change }: { value: ReactNode; change?: ReactNode }) {
  return (
    <span className="inline-flex items-center justify-end gap-1.5 tabular-nums">
      {value}
      {change}
    </span>
  );
}

const monthLabel = (month: string) => {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, 1).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
};

/**
 * Clicks per month as a tiny line (no axes); the last month is dotted. The
 * figures are in its accessible name and tooltip.
 */
export function Sparkline({ points, width = 96, height = 28 }: { points: MonthlyClicks[]; width?: number; height?: number }) {
  if (points.length < 2) return <span className="text-xs text-muted-foreground">—</span>;
  const values = points.map((p) => p.clicks);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const pad = 3;
  const x = (i: number) => pad + (i * (width - pad * 2)) / (points.length - 1);
  const y = (v: number) => (max === min ? height / 2 : pad + ((max - v) * (height - pad * 2)) / (max - min));
  const path = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const summary = `Clicks by month: ${points.map((p) => `${monthLabel(p.month)} ${formatNumber(p.clicks)}`).join(', ')}`;
  const last = values.length - 1;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={summary} className="overflow-visible">
      <title>{summary}</title>
      <path d={path} fill="none" stroke="var(--chart-current)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(last)} cy={y(values[last])} r="2.5" fill="var(--chart-current)" stroke="var(--card)" strokeWidth="1.5" />
    </svg>
  );
}

/** Small grey chips, e.g. a page's top searches. */
export function Chips({ items, max = 3 }: { items: string[]; max?: number }) {
  if (items.length === 0) return <span className="text-xs text-muted-foreground">—</span>;
  const shown = items.slice(0, max);
  const more = items.length - shown.length;
  return (
    <span className="flex flex-wrap gap-1">
      {shown.map((q) => (
        <span key={q} className="max-w-48 truncate rounded border bg-muted/60 px-1.5 py-0.5 text-2xs font-medium text-foreground" title={q}>
          {q}
        </span>
      ))}
      {more > 0 && (
        <span className="rounded px-1 py-0.5 text-2xs text-muted-foreground" title={items.slice(max).join(', ')}>
          +{more} more
        </span>
      )}
    </span>
  );
}
