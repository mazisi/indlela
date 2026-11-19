import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { fieldAria } from '@/features/auth/lib/fieldAria';
import { cn } from '@/lib/utils';

export interface ComboboxOption {
  value: string;
  label: string;
  /** Also searched, not shown (e.g. a client's legal name). */
  keywords?: string;
}

interface ComboboxProps {
  options: readonly ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  /** Wires the trigger to its FormField label and error; leave out for a toolbar filter (use `aria-label`). */
  id?: string;
  error?: string;
  'aria-label'?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
  /** For lists searched on the server: called as the user types (the options should then be the matches). */
  onSearchChange?: (search: string) => void;
}

/** Matches the label and keywords (not the value, which is often an id); every word must match. */
function matchLabel(_value: string, search: string, keywords?: string[]): number {
  const label = (keywords ?? []).join(' ').toLowerCase();
  return search
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => label.includes(word))
    ? 1
    : 0;
}

/**
 * A Select you can type into, for lists that can get long (departments,
 * people…). The popover is modal so its list scrolls inside a drawer too.
 * Picking the selected option again keeps it (no accidental clearing).
 */
export function Combobox({
  options,
  value,
  onChange,
  id,
  error,
  'aria-label': ariaLabel,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyText = 'Nothing matches.',
  disabled = false,
  className,
  onSearchChange,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={ariaLabel}
          disabled={disabled}
          {...(id ? fieldAria(id, error) : {})}
          className={cn('w-full justify-between font-normal', !selected && 'text-muted-foreground', error && 'border-bad', className)}
        >
          <span className="min-w-0 truncate text-left">{selected ? selected.label : placeholder}</span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-52 p-0" align="start">
        <Command filter={matchLabel}>
          <CommandInput placeholder={searchPlaceholder} onValueChange={onSearchChange} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem
                  key={o.value}
                  value={o.value}
                  keywords={o.keywords ? [o.label, o.keywords] : [o.label]}
                  onSelect={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                >
                  <Check className={cn('size-4', o.value === value ? 'opacity-100' : 'opacity-0')} aria-hidden />
                  {o.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
