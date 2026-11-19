import { cn } from '@/lib/utils';

/** The Indlela logo lock-up. `inverted` for dark (brand) backgrounds. */
export function BrandMark({ inverted = false, compact = false }: { inverted?: boolean; compact?: boolean }) {
  return (
    <div className="relative flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden>
        <rect width="32" height="32" rx="7" fill={inverted ? '#ffffff' : 'var(--brand)'} />
        <path
          d="M9.5 25c0-6.5 13-4.5 13-11.5 0-3-2.4-5-5.5-5"
          fill="none"
          stroke={inverted ? 'var(--brand)' : '#ffffff'}
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12.5" cy="8.5" r="2" fill="#7fb5dc" />
      </svg>
      {!compact && (
        <div className="leading-tight">
          <div className={cn('text-base font-bold tracking-tight', inverted ? 'text-white' : 'text-foreground')}>
            Indlela
          </div>
          <div className={cn('text-2xs uppercase tracking-wider', inverted ? 'text-brand-foreground' : 'text-muted-foreground')}>
            SEO for agencies
          </div>
        </div>
      )}
    </div>
  );
}
