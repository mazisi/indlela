import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { ClientRef } from '@/features/auth/types';

const ALL = 'all';

interface ClientSelectProps {
  id: string;
  clients: ClientRef[];
  value: number | undefined;
  onChange: (id: number | undefined) => void;
  /** Offers "All clients" (a filter) when set. */
  allLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
  'aria-label'?: string;
}

/** One of the clients this user can work on (the API's `user.clients`). */
export function ClientSelect({ id, clients, value, onChange, allLabel, placeholder = 'Choose a client', disabled, className, ...aria }: ClientSelectProps) {
  return (
    <Select value={value ? String(value) : allLabel ? ALL : ''} onValueChange={(v) => onChange(v === ALL ? undefined : Number(v))} disabled={disabled}>
      <SelectTrigger id={id} className={cn('w-full', className)} {...aria}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allLabel && <SelectItem value={ALL}>{allLabel}</SelectItem>}
        {clients.map((c) => (
          <SelectItem key={c.id} value={String(c.id)}>
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
