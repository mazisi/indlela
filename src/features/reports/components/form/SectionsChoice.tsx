import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { SECTIONS } from '../../lib/sections';
import type { ReportSection } from '../../types';

interface Props {
  idPrefix: string;
  value: ReportSection[];
  onChange: (value: ReportSection[]) => void;
  error?: string;
}

/** Which parts the report covers (at least one), in the report's order. */
export function SectionsChoice({ idPrefix, value, onChange, error }: Props) {
  const toggle = (key: ReportSection, on: boolean) => onChange(SECTIONS.map((s) => s.key).filter((k) => (k === key ? on : value.includes(k))));
  return (
    <fieldset className="space-y-1.5" aria-describedby={error ? `${idPrefix}-error` : undefined}>
      <legend className="mb-1.5 text-sm font-medium text-foreground">Sections</legend>
      <div className="grid gap-2">
        {SECTIONS.map(({ key, label, hint, icon: Icon }) => {
          const checked = value.includes(key);
          return (
            <label
              key={key}
              htmlFor={`${idPrefix}-${key}`}
              className={cn('flex cursor-pointer items-start gap-3 rounded border bg-card px-3 py-2.5 transition-colors', checked ? 'border-primary/50 ring-1 ring-primary/30' : 'hover:border-primary/30')}
            >
              <Checkbox id={`${idPrefix}-${key}`} checked={checked} onCheckedChange={(v) => toggle(key, v === true)} className="mt-0.5" />
              <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span>
                <span className="block text-sm font-medium">{label}</span>
                <span className="block text-xs text-muted-foreground">{hint}</span>
              </span>
            </label>
          );
        })}
      </div>
      {error && (
        <p id={`${idPrefix}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </fieldset>
  );
}
