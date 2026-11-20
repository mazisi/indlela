import { Monitor, Smartphone } from 'lucide-react';
import { ChangeBadge } from '@/features/search-console/components/ChangeBadge';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/formatDate';
import { DEVICE_LABEL, formatRank } from '../lib/position';
import { SERP_FEATURES } from '../lib/serpFeatures';
import type { Device, HistoryPoint, SerpFeatures } from '../types';

/**
 * A change in position, as the API counts it: positive = moved up the
 * rankings (improved), shown green with an up arrow.
 */
export function PositionChange({ value, context, className }: { value: number | null | undefined; context?: string; className?: string }) {
  return <ChangeBadge value={value} better="higher" format={(n) => String(Math.round(n))} label="Position" context={context} className={className} />;
}

/** A position, or "—" with a screen-reader explanation when not in the top 100. */
export function Rank({ position, className }: { position: number | null | undefined; className?: string }) {
  if (!position) {
    return (
      <span className={cn('text-muted-foreground', className)} title="Not in the top 100">
        —<span className="sr-only">Not in the top 100</span>
      </span>
    );
  }
  return <span className={cn('font-semibold tabular-nums', className)}>{formatRank(position)}</span>;
}

export function DeviceIcon({ device, withLabel }: { device: Device; withLabel?: boolean }) {
  const Icon = device === 'mobile' ? Smartphone : Monitor;
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground" title={DEVICE_LABEL[device]}>
      <Icon className="size-3.5" aria-hidden />
      {withLabel ? <span className="text-xs">{DEVICE_LABEL[device]}</span> : <span className="sr-only">{DEVICE_LABEL[device]}</span>}
    </span>
  );
}

/** One icon per SERP feature that showed: filled (primary) when the site appears in it, outlined when only present. */
export function SerpFeatureIcons({ features }: { features: SerpFeatures | null }) {
  const shown = SERP_FEATURES.filter((f) => features?.[f.key]?.present);
  if (shown.length === 0) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <span className="inline-flex items-center gap-1">
      {shown.map(({ key, label, icon: Icon }) => {
        const ours = Boolean(features?.[key]?.ours);
        const text = ours ? `${label}: you appear in it` : `${label}: shown, you're not in it`;
        return (
          <span
            key={key}
            role="img"
            aria-label={text}
            title={text}
            data-ours={ours}
            className={cn('grid size-5 place-items-center rounded border', ours ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground')}
          >
            <Icon className="size-3" aria-hidden />
          </span>
        );
      })}
    </span>
  );
}

/** Tags as small chips. */
export function Tags({ tags, max = 3 }: { tags: string[]; max?: number }) {
  if (tags.length === 0) return null;
  const shown = tags.slice(0, max);
  return (
    <span className="mt-0.5 flex flex-wrap gap-1">
      {shown.map((t) => (
        <span key={t} className="rounded bg-muted px-1.5 py-px text-2xs font-medium text-muted-foreground">
          {t}
        </span>
      ))}
      {tags.length > max && (
        <span className="px-0.5 text-2xs text-muted-foreground" title={tags.slice(max).join(', ')}>
          +{tags.length - max}
        </span>
      )}
    </span>
  );
}

/** Below this many checked points, a line says nothing. */
const MIN_POINTS = 2;

/**
 * The last checks as a tiny line with position 1 at the top (up = better);
 * days out of the top 100 break the line. Figures are in its accessible name.
 */
export function PositionSparkline({ points, width = 88, height = 26 }: { points: HistoryPoint[]; width?: number; height?: number }) {
  const ranked = points.filter((p) => p.position);
  if (ranked.length < MIN_POINTS) return <span className="text-xs text-muted-foreground">—</span>;
  const values = ranked.map((p) => p.position as number);
  const best = Math.min(...values);
  const worst = Math.max(...values);
  const pad = 3;
  const x = (i: number) => pad + (i * (width - pad * 2)) / Math.max(1, points.length - 1);
  // Inverted: the best (lowest) position sits at the top.
  const y = (v: number) => (best === worst ? height / 2 : pad + ((v - best) * (height - pad * 2)) / (worst - best));

  let path = '';
  let penDown = false;
  points.forEach((p, i) => {
    if (!p.position) {
      penDown = false;
      return;
    }
    path += `${penDown ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.position).toFixed(1)} `;
    penDown = true;
  });
  const lastIndex = points.length - 1;
  const last = points[lastIndex];
  const first = ranked[0];
  const summary = `Position over the last ${points.length} checks: from ${formatRank(first.position)} on ${formatDate(first.date)} to ${last.position ? formatRank(last.position) : 'not in the top 100'} on ${formatDate(last.date)}; best ${best}.`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={summary} data-testid="position-sparkline" className="overflow-visible">
      <title>{summary}</title>
      <path d={path.trim()} fill="none" stroke="var(--chart-current)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      {last.position ? <circle cx={x(lastIndex)} cy={y(last.position)} r="2.5" fill="var(--chart-current)" stroke="var(--card)" strokeWidth="1.5" /> : null}
    </svg>
  );
}
