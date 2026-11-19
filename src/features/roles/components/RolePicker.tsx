import { Edit, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Role } from '../types';

interface RolePickerProps {
  roles: Role[];
  role: Role;
  onSelect: (roleId: number) => void;
  canUpdate: boolean;
  canDelete: boolean;
  isDirty: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onReset: () => void;
}

const people = (n: number) => `${n} ${n === 1 ? 'user' : 'users'}`;

/** The role being edited, its details and the role-level actions (compliance RolesTab bar). */
export function RolePicker({ roles, role, onSelect, canUpdate, canDelete, isDirty, onEdit, onDelete, onReset }: RolePickerProps) {
  return (
    <div className="flex flex-col gap-3 rounded border bg-card p-3 sm:flex-row sm:items-center">
      <div className="flex min-w-0 items-center gap-2">
        <label htmlFor="role-picker" className="text-sm font-medium">
          Role
        </label>
        <Select value={String(role.id)} onValueChange={(v) => onSelect(Number(v))}>
          <SelectTrigger id="role-picker" className="w-full sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roles.map((r) => (
              <SelectItem key={r.id} value={String(r.id)}>
                {r.name}
                <span className="text-xs text-muted-foreground">· {people(r.usersCount)}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="min-w-0 flex-1 text-sm text-muted-foreground">
        {role.description}
        <span className="ml-1.5 text-xs">{role.description ? '· ' : ''}{role.allClients ? 'Sees every client' : 'Assigned clients only'}</span>
      </p>

      <div className="flex flex-wrap items-center gap-1.5">
        {!role.isSystem && canUpdate && (
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit />
            Edit role
          </Button>
        )}
        {!role.isSystem && canDelete && (
          <Button
            variant="outline"
            size="sm"
            className="text-bad hover:bg-bad-soft hover:text-bad"
            onClick={onDelete}
            disabled={role.usersCount > 0}
            title={role.usersCount > 0 ? 'Give its users another role first' : undefined}
          >
            <Trash2 />
            Delete
          </Button>
        )}
        {canUpdate && (
          <Button variant="ghost" size="sm" onClick={onReset} disabled={!isDirty}>
            <RotateCcw />
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}
