import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { SCHEDULE_HINT, SCHEDULE_LABEL } from '../../lib/labels';
import type { GridSchedule } from '../../types';

const OPTIONS: GridSchedule[] = ['none', 'weekly', 'monthly'];

/** Manual only (the default), weekly or monthly scans. */
export function ScheduleChoice({ value, onChange, error }: { value: GridSchedule; onChange: (v: GridSchedule) => void; error?: string }) {
  return (
    <fieldset className="space-y-1.5">
      <legend className="mb-1.5 text-sm font-medium text-foreground">Schedule</legend>
      <RadioGroup value={value} onValueChange={(v) => onChange(v as GridSchedule)} aria-label="Schedule" className="grid gap-2 sm:grid-cols-3">
        {OPTIONS.map((o) => (
          <label
            key={o}
            htmlFor={`grid-schedule-${o}`}
            className={cn('flex cursor-pointer items-start gap-2.5 rounded border bg-card px-3 py-2.5 transition-colors', value === o ? 'border-primary/50 ring-1 ring-primary/30' : 'hover:border-primary/30')}
          >
            <RadioGroupItem id={`grid-schedule-${o}`} value={o} className="mt-0.5" />
            <span>
              <span className="block text-sm font-medium">{SCHEDULE_LABEL[o]}</span>
              <span className="block text-xs text-muted-foreground">{SCHEDULE_HINT[o]}</span>
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
