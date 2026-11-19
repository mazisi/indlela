import { cn } from '@/lib/utils';

interface Props<T extends string> {
  label: string;
  value: T;
  onChange: (value: T) => void;
  /** [value, label, count?, tone?] */
  options: readonly (readonly [T, string, number?, ('bad' | 'warn' | 'ok')?])[];
}

const TONE = { bad: 'text-bad', warn: 'text-warn', ok: 'text-ok' } as const;

/** A row of toggle buttons (one pressed), with optional counts coloured by tone. */
export function Segmented<T extends string>({ label, value, onChange, options }: Props<T>) {
  return (
    <div role="group" aria-label={label} className="inline-flex h-9 max-w-full shrink-0 gap-0.5 self-start overflow-x-auto rounded border bg-muted/40 p-0.5">
      {options.map(([key, text, count, tone]) => (
        <button
          key={key}
          type="button"
          aria-pressed={value === key}
          onClick={() => onChange(key)}
          className={cn(
            'inline-flex items-center gap-1.5 whitespace-nowrap rounded px-2.5 text-sm font-medium transition-colors',
            value === key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {text}
          {count !== undefined && ' '}
          {count !== undefined && <span className={cn('text-xs font-semibold tabular-nums', count > 0 && tone ? TONE[tone] : 'text-muted-foreground')}>{count}</span>}
        </button>
      ))}
    </div>
  );
}
