import { cn } from '@/lib/utils';
import { BAND_TONE, healthBand, performanceBand } from '../lib/health';

// Needle-gauge geometry (SVG user units). 0 sits at 9 o'clock, 100 at 3 o'clock.
const CX = 100;
const CY = 96;
const R = 76; // band centre line
const BAND_WIDTH = 12;
const GAP = 0.9; // score units left blank between bands, a surface-coloured spacer

/** The health bands as arc segments, matching healthBand(). Fills are the gauge status tokens in index.css. */
const GAUGE_BANDS = [
  { from: 0, to: 50, band: 'poor', fill: 'var(--gauge-poor)' },
  { from: 50, to: 80, band: 'fair', fill: 'var(--gauge-fair)' },
  { from: 80, to: 100, band: 'good', fill: 'var(--gauge-good)' },
] as const;

const TICKS = Array.from({ length: 11 }, (_, i) => i * 10);

function polar(value: number, radius: number): { x: number; y: number } {
  const angle = Math.PI * (1 - value / 100);
  return { x: CX + radius * Math.cos(angle), y: CY - radius * Math.sin(angle) };
}

function arc(from: number, to: number): string {
  const a = polar(from, R);
  const b = polar(to, R);
  return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${R} ${R} 0 0 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
}

/**
 * The audit's health score (0–100) as a needle gauge: red / amber / green
 * bands for Poor (<50), Needs work (50–79) and Good (80+), ticks every 10,
 * and a needle at the score. The number and the band are written underneath,
 * so it never reads by colour alone. The needle swings to a new score
 * (no motion with prefers-reduced-motion).
 */
export function HealthGauge({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' }) {
  const view = healthBand(score);
  const tone = BAND_TONE[view.band];
  const value = Math.max(0, Math.min(100, score));
  const needleLength = R - BAND_WIDTH / 2 - 6;
  return (
    <div
      role="img"
      aria-label={`Health score ${score} out of 100: ${view.label}`}
      className={cn('flex shrink-0 flex-col items-center', size === 'md' ? 'w-52' : 'w-32')}
    >
      <svg viewBox="0 0 200 112" className="w-full overflow-visible" aria-hidden>
        {GAUGE_BANDS.map((b) => (
          <path
            key={b.band}
            d={arc(b.from === 0 ? 0 : b.from + GAP / 2, b.to === 100 ? 100 : b.to - GAP / 2)}
            fill="none"
            stroke={b.fill}
            strokeWidth={BAND_WIDTH}
            strokeLinecap="butt"
          />
        ))}

        {TICKS.map((t) => {
          const inner = polar(t, R + BAND_WIDTH / 2 + 2);
          const outer = polar(t, R + BAND_WIDTH / 2 + (t % 20 === 0 ? 7 : 4));
          return <line key={t} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} className="stroke-muted-foreground/60" strokeWidth={1} />;
        })}
        {size === 'md' &&
          TICKS.filter((t) => t % 20 === 0).map((t) => {
            // The end labels sit beside their tick, anchored away from the arc.
            const end = t === 0 || t === 100;
            const p = polar(t, R + BAND_WIDTH / 2 + (end ? 10 : 15));
            const anchor = t === 0 ? 'end' : t === 100 ? 'start' : 'middle';
            return (
              <text key={t} x={p.x} y={p.y} textAnchor={anchor} dominantBaseline="middle" className="fill-muted-foreground text-[9px] tabular-nums">
                {t}
              </text>
            );
          })}

        {/* Drawn pointing at 0, then rotated to the score about the hub. */}
        <g
          className="text-foreground transition-transform duration-700 ease-out motion-reduce:transition-none"
          style={{ transform: `rotate(${(value / 100) * 180}deg)`, transformOrigin: `${CX}px ${CY}px` }}
        >
          <polygon points={`${CX - needleLength},${CY} ${CX},${CY - 3.5} ${CX},${CY + 3.5}`} fill="currentColor" />
        </g>
        <circle cx={CX} cy={CY} r={6.5} className="fill-foreground" />
        <circle cx={CX} cy={CY} r={2.5} className="fill-card" />
      </svg>
      <div className="-mt-1 flex flex-col items-center leading-none">
        <span className={cn('font-bold tabular-nums', tone.text, size === 'md' ? 'text-xl' : 'text-lg')}>{score}</span>
        <span className={cn('mt-1 text-2xs font-semibold uppercase tracking-wider', tone.text)}>{view.label}</span>
      </div>
    </div>
  );
}

/** A Lighthouse-style performance score ring (90+ good, 50–89 needs improvement, under 50 poor). */
export function ScoreRing({ score, label = 'Performance score' }: { score: number; label?: string }) {
  const view = performanceBand(score);
  const tone = BAND_TONE[view.band];
  const value = Math.max(0, Math.min(100, Math.round(score)));
  return (
    <div role="img" aria-label={`${label} ${value} out of 100: ${view.label}`} className="relative size-14 shrink-0">
      <svg viewBox="0 0 48 48" className="size-full -rotate-90" aria-hidden>
        <circle cx="24" cy="24" r="20" fill="none" stroke={tone.track} strokeWidth="4" />
        {value > 0 && <circle cx="24" cy="24" r="20" fill="none" stroke={tone.stroke} strokeWidth="4" strokeLinecap="round" pathLength={100} strokeDasharray={`${value} 100`} />}
      </svg>
      <span className={cn('absolute inset-0 grid place-items-center text-sm font-bold tabular-nums', tone.text)}>{value}</span>
    </div>
  );
}

/** A score as a compact pill for tables: the number on its band's soft colour, with the band for screen readers. */
export function HealthPill({ score }: { score: number | null }) {
  if (score === null) return <span className="text-xs text-muted-foreground">—</span>;
  const view = healthBand(score);
  const tone = BAND_TONE[view.band];
  return (
    <span className="inline-flex items-center gap-2" title={`${view.label}`}>
      <span className={cn('inline-flex min-w-9 justify-center rounded px-1.5 py-0.5 text-xs font-bold tabular-nums', tone.soft, tone.text)}>{score}</span>
      <span className="hidden h-1.5 w-16 overflow-hidden rounded-full lg:block" style={{ background: tone.track }} aria-hidden>
        <span className={cn('block h-full rounded-full', tone.fill)} style={{ width: `${score}%` }} />
      </span>
      <span className="sr-only">{view.label}</span>
    </span>
  );
}
