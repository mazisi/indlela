import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: readonly (readonly [string, string])[];
  'aria-label': string;
  disabled?: boolean;
  className?: string;
}

/** A small Select for table rows and toolbars, named by `aria-label`. */
export function CompactSelect({ value, onChange, options, disabled, className, ...rest }: Props) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger size="sm" aria-label={rest['aria-label']} className={cn('h-7 w-full min-w-40 text-[13px]', className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map(([v, label]) => (
          <SelectItem key={v} value={v}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
