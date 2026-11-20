import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import type { Frequency } from '../../types';

const OPTIONS: { value: Frequency; label: string; hint: string }[] = [
  { value: 'weekly', label: 'Weekly', hint: 'Once a week: the trend without the day-to-day noise. Recommended.' },
  { value: 'daily', label: 'Daily (uses 7× more checks)', hint: 'Every night: catch drops the next morning.' },
];

/** Weekly (the default) or daily checks. */
export function FrequencyChoice({ idPrefix, value, onChange, error }: { idPrefix: string; value: Frequency; onChange: (v: Frequency) => void; error?: string }) {
  return (
    <fieldset className="space-y-1.5">
      <legend className="mb-1.5 text-sm font-medium text-foreground">How often to check</legend>
      <RadioGroup value={value} onValueChange={(v) => onChange(v as Frequency)} aria-label="How often to check" className="grid gap-2 sm:grid-cols-2">
        {OPTIONS.map((o) => (
          <label
            key={o.value}
            htmlFor={`${idPrefix}-${o.value}`}
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded border bg-card px-3 py-2.5 transition-colors',
              value === o.value ? 'border-primary/50 ring-1 ring-primary/30' : 'hover:border-primary/30',
            )}
          >
            <RadioGroupItem id={`${idPrefix}-${o.value}`} value={o.value} className="mt-0.5" />
            <span>
              <span className="block text-sm font-medium">{o.label}</span>
              <span className="block text-xs text-muted-foreground">{o.hint}</span>
            </span>
          </label>
        ))}
      </RadioGroup>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </fieldset>
  );
}
