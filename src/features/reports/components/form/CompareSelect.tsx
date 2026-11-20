import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormField } from '@/features/auth/components/FormField';
import { fieldAria } from '@/features/auth/lib/fieldAria';
import { COMPARE_OPTIONS } from '../../lib/sections';
import type { ReportCompare } from '../../types';

/** What the report's changes are measured against. */
export function CompareSelect({ id, value, onChange, error }: { id: string; value: ReportCompare; onChange: (v: ReportCompare) => void; error?: string }) {
  return (
    <FormField id={id} label="Compare with" error={error} hint="Changes (“Traffic up 14%”) are measured against this.">
      <Select value={value} onValueChange={(v) => onChange(v as ReportCompare)}>
        <SelectTrigger {...fieldAria(id, error, true)} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {COMPARE_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  );
}
