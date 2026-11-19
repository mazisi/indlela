import { ShieldCheck } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormField } from '@/features/auth/components/FormField';
import { fieldAria } from '@/features/auth/lib/fieldAria';
import type { ClientRef, MfaChannel } from '@/features/auth/types';
import { ClientChecklist } from '@/features/clients/components/ClientChecklist';
import type { UserRoleOption } from '../types';

interface RoleSelectProps {
  id: string;
  roles: UserRoleOption[];
  value: number | undefined;
  onChange: (id: number) => void;
  error?: string;
}

/** Role picker with each role's one-line description. */
export function RoleSelect({ id, roles, value, onChange, error }: RoleSelectProps) {
  const chosen = roles.find((r) => r.id === value);
  return (
    <FormField id={id} label="Role" error={error} hint={chosen?.description ?? undefined} required>
      <Select value={value ? String(value) : ''} onValueChange={(v) => onChange(Number(v))}>
        <SelectTrigger {...fieldAria(id, error, Boolean(chosen?.description))} className="w-full">
          <SelectValue placeholder="Choose a role" />
        </SelectTrigger>
        <SelectContent>
          {roles.map((r) => (
            <SelectItem key={r.id} value={String(r.id)}>
              {r.name}
              {r.isSystem ? (
                <span className="text-xs text-muted-foreground">· full access</span>
              ) : (
                r.allClients && <span className="text-xs text-muted-foreground">· every client</span>
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  );
}

const PIN_LABELS: Record<MfaChannel, string> = { sms: 'SMS', email: 'Email', off: 'Off (not recommended)' };

interface PinChannelSelectProps<T extends MfaChannel> {
  id: string;
  value: T;
  onChange: (value: T) => void;
  channels: readonly T[];
}

/** How the sign-in one-time PIN is sent. */
export function PinChannelSelect<T extends MfaChannel>({ id, value, onChange, channels }: PinChannelSelectProps<T>) {
  return (
    <FormField id={id} label="One-time PIN by" required>
      <Select value={value} onValueChange={(v) => onChange(v as T)}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {channels.map((c) => (
            <SelectItem key={c} value={c}>
              {PIN_LABELS[c]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormField>
  );
}

interface ClientsFieldProps {
  id: string;
  clients: ClientRef[];
  value: number[];
  onChange: (ids: number[]) => void;
  /** The chosen role sees every client (Owner, or "Sees every client"): nothing to tick. */
  fullAccess: boolean;
  error?: string;
}

/** Client access: the clients a user works on; a role that sees every client needs none ticked. */
export function ClientsField({ id, clients, value, onChange, fullAccess, error }: ClientsFieldProps) {
  return (
    <fieldset className="space-y-1.5" aria-describedby={error && !fullAccess ? `${id}-error` : undefined}>
      <legend className="text-sm font-medium">
        Client access{!fullAccess && <span className="text-bad"> *</span>}
      </legend>
      {fullAccess ? (
        <p className="flex items-center gap-2 rounded border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          <ShieldCheck className="size-4 shrink-0 text-primary" aria-hidden />
          This role sees every client of the workspace, including ones added later.
        </p>
      ) : (
        <>
          {clients.length === 0 ? (
            <p className="rounded border border-dashed px-3 py-2 text-sm text-muted-foreground">No clients yet. Add them under Clients, then give access here.</p>
          ) : (
            <ClientChecklist clients={clients} value={value} onChange={onChange} />
          )}
          {error && (
            <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}
        </>
      )}
    </fieldset>
  );
}
