import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { describeRange, MONTHS_BACK, PERIOD_OPTIONS, resolvePeriod, type FormPeriod } from '../../lib/period';

/** Last month (the default), this month so far, a specific month, the last 3 months or a custom range, each with the dates it covers. */
export function PeriodChoice({ idPrefix, value, onChange }: { idPrefix: string; value: FormPeriod; onChange: (v: FormPeriod) => void }) {
  return (
    <fieldset className="space-y-1.5">
      <legend className="mb-1.5 text-sm font-medium text-foreground">Period</legend>
      <RadioGroup value={value} onValueChange={(v) => onChange(v as FormPeriod)} aria-label="Period" className="grid gap-2 sm:grid-cols-2">
        {PERIOD_OPTIONS.map((o) => {
          const range = o.value === 'custom' || o.value === 'month' ? null : resolvePeriod(o.value);
          const hint = range ? describeRange(range.start, range.end) : o.value === 'month' ? `Any of the last ${MONTHS_BACK} months` : 'Choose the first and last day';
          return (
            <label
              key={o.value}
              htmlFor={`${idPrefix}-${o.value}`}
              className={cn('flex cursor-pointer items-start gap-3 rounded border bg-card px-3 py-2.5 transition-colors', value === o.value ? 'border-primary/50 ring-1 ring-primary/30' : 'hover:border-primary/30')}
            >
              <RadioGroupItem id={`${idPrefix}-${o.value}`} value={o.value} className="mt-0.5" />
              <span className="min-w-0">
                <span className="block text-sm font-medium">{o.label}</span>
                <span className="block truncate text-xs text-muted-foreground">{hint}</span>
              </span>
            </label>
          );
        })}
      </RadioGroup>
    </fieldset>
  );
}
