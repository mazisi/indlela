import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fieldAria } from '@/features/auth/lib/fieldAria';

interface OptionSelectProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  /** [value, label] pairs, or plain strings used as both. */
  options: readonly (string | readonly [string, string])[];
  error?: string;
  placeholder?: string;
  /** Names the control when it has no FormField label (e.g. a row in a list). */
  ariaLabel?: string;
}

/** A Select over a fixed list, wired to its FormField label and error. */
export function OptionSelect({ id, value, onChange, options, error, placeholder, ariaLabel }: OptionSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger {...fieldAria(id, error)} aria-label={ariaLabel} className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => {
          const [v, label] = typeof o === 'string' ? [o, o] : o;
          return (
            <SelectItem key={v} value={v}>
              {label}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
