import { Checkbox } from '@/components/ui/checkbox';
import type { ClientRef } from '@/features/auth/types';

interface ClientChecklistProps {
  clients: ClientRef[];
  value: number[];
  onChange: (ids: number[]) => void;
  disabled?: boolean;
}

/** Tick the clients a user may work on (client access in the user form). */
export function ClientChecklist({ clients, value, onChange, disabled }: ClientChecklistProps) {
  return (
    <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
      {clients.map((client) => (
        <label
          key={client.id}
          className="flex cursor-pointer items-center gap-2 rounded border px-2.5 py-2 text-sm has-[button[data-state=checked]]:border-primary has-[button[data-state=checked]]:bg-accent/60"
          title={client.name}
        >
          <Checkbox
            checked={value.includes(client.id)}
            disabled={disabled}
            onCheckedChange={(on) => onChange(on ? [...value, client.id] : value.filter((id) => id !== client.id))}
          />
          <span className="truncate">{client.name}</span>
        </label>
      ))}
    </div>
  );
}
