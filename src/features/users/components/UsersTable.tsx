import type { ReactNode } from 'react';
import { Edit, KeyRound, LockOpen, Trash2, type LucideIcon } from 'lucide-react';
import { ActionsHead } from '@/components/table/ActionsHead';
import { TABLE_HEAD } from '@/components/table/tableStyles';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDateTime } from '@/utils/formatDate';
import { cn } from '@/lib/utils';
import type { RowSelection } from '@/hooks/useRowSelection';
import { UserStatusBadge } from './UserStatusBadge';
import type { AppUser } from '../types';

/** Each action is set only when the viewer has its permission. */
export interface UserRowActions {
  onEdit?: (user: AppUser) => void;
  onDelete?: (user: AppUser) => void;
  onUnlock?: (user: AppUser) => void;
  onResetPassword?: (user: AppUser) => void;
  selection?: RowSelection<number>;
}

const COLUMNS = ['User', 'Role', 'Clients', '2FA', 'Last sign-in', 'Status'] as const;
const PIN = { sms: 'SMS', email: 'Email', off: 'Off' } as const;

const clientsOf = (u: AppUser) =>
  u.role?.isSystem || u.role?.allClients ? 'All clients' : u.clients.map((c) => c.name).join(', ') || '—';

function UserCell({ user }: { user: AppUser }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 font-semibold">
        <span className="truncate">{user.name}</span>
        {user.isYou && <span className="rounded bg-accent px-1 py-px text-2xs font-semibold text-primary">You</span>}
      </div>
      <div className="truncate text-xs text-muted-foreground">{user.email}</div>
    </div>
  );
}

function Pin({ user }: { user: AppUser }) {
  if (!user.mfaChannel) return <span className="text-muted-foreground">—</span>;
  return <span className={cn(user.mfaChannel === 'off' && 'font-medium text-bad')}>{PIN[user.mfaChannel]}</span>;
}

interface IconActionProps {
  icon: LucideIcon;
  /** Tooltip, e.g. "Unlock". */
  title: string;
  /** Screen-reader label naming the user, e.g. "Unlock Kevin Adams". */
  label: string;
  onClick: () => void;
  tone?: 'primary' | 'bad';
}

function IconAction({ icon: Icon, title, label, onClick, tone = 'primary' }: IconActionProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn('size-6', tone === 'bad' ? 'text-bad hover:bg-bad-soft hover:text-bad' : 'text-primary hover:text-primary/80')}
      onClick={onClick}
      aria-label={label}
      title={title}
    >
      <Icon className="size-3.5" />
    </Button>
  );
}

function RowButtons({ user, actions }: { user: AppUser; actions: UserRowActions }) {
  const { onEdit, onDelete, onUnlock, onResetPassword } = actions;
  return (
    <div className="flex items-center justify-end gap-0.5">
      {onUnlock && user.status === 'locked' && <IconAction icon={LockOpen} title="Unlock" label={`Unlock ${user.name}`} onClick={() => onUnlock(user)} />}
      {onResetPassword && (user.status === 'active' || user.status === 'locked') && (
        <IconAction icon={KeyRound} title="Reset password" label={`Reset password for ${user.name}`} onClick={() => onResetPassword(user)} />
      )}
      {onEdit && <IconAction icon={Edit} title="Edit" label={`Edit ${user.name}`} onClick={() => onEdit(user)} />}
      {onDelete && !user.isYou && <IconAction icon={Trash2} tone="bad" title="Delete" label={`Delete ${user.name}`} onClick={() => onDelete(user)} />}
    </div>
  );
}

function SelectBox({ user, selection }: { user: AppUser; selection: RowSelection<number> }) {
  // You can't disable or delete yourself, so your own row can't be selected.
  if (user.isYou) return <span className="inline-block size-4" aria-hidden />;
  return <Checkbox checked={selection.isSelected(user.id)} onCheckedChange={() => selection.toggle(user.id)} aria-label={`Select ${user.name}`} />;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-2xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="truncate text-sm">{children}</dd>
    </div>
  );
}

/** Desktop table from md up; one card per user below. */
export function UsersTable({ users, actions }: { users: AppUser[]; actions?: UserRowActions }) {
  const selection = actions?.selection;
  const hasButtons = Boolean(actions && (actions.onEdit || actions.onDelete || actions.onUnlock || actions.onResetPassword));

  return (
    <>
      <div className="hidden rounded border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {selection && (
                <TableHead className="w-10 px-3">
                  <Checkbox
                    checked={selection.headerState}
                    onCheckedChange={(v) => selection.toggleAll(v === true)}
                    aria-label="Select all users on this page"
                  />
                </TableHead>
              )}
              {COLUMNS.map((c) => (
                <TableHead key={c} className={TABLE_HEAD}>
                  {c}
                </TableHead>
              ))}
              {hasButtons && <ActionsHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id} data-state={selection?.isSelected(u.id) ? 'selected' : undefined}>
                {selection && (
                  <TableCell className="px-3">
                    <SelectBox user={u} selection={selection} />
                  </TableCell>
                )}
                <TableCell className="max-w-64 px-3">
                  <UserCell user={u} />
                </TableCell>
                <TableCell className="px-3">{u.role?.name ?? '—'}</TableCell>
                <TableCell className="max-w-48 truncate px-3 text-xs" title={clientsOf(u)}>
                  {clientsOf(u)}
                </TableCell>
                <TableCell className="px-3 text-xs">
                  <Pin user={u} />
                </TableCell>
                <TableCell className="px-3 font-mono text-xs tabular-nums text-muted-foreground">
                  {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : '—'}
                </TableCell>
                <TableCell className="px-3">
                  <UserStatusBadge status={u.status} label={u.statusLabel} />
                </TableCell>
                {hasButtons && actions && (
                  <TableCell className="px-3">
                    <RowButtons user={u} actions={actions} />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="md:hidden">
        {selection && (
          <label className="mb-2 flex items-center gap-2 px-1">
            <Checkbox
              checked={selection.headerState}
              onCheckedChange={(v) => selection.toggleAll(v === true)}
              aria-label="Select all users on this page"
            />
            <span className="text-xs text-muted-foreground">Select all</span>
          </label>
        )}
        <ul className="space-y-2">
          {users.map((u) => (
            <li key={u.id} className={cn('rounded border bg-card p-3', selection?.isSelected(u.id) && 'border-primary/40 bg-accent/40')}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-2.5">
                  {selection && (
                    <div className="pt-0.5">
                      <SelectBox user={u} selection={selection} />
                    </div>
                  )}
                  <UserCell user={u} />
                </div>
                <UserStatusBadge status={u.status} label={u.statusLabel} />
              </div>
              <dl className={cn('mt-2 grid grid-cols-2 gap-2', selection && 'pl-6.5')}>
                <Field label="Role">{u.role?.name ?? '—'}</Field>
                <Field label="Clients">{clientsOf(u)}</Field>
                <Field label="2FA">
                  <Pin user={u} />
                </Field>
                <Field label="Last sign-in">{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : '—'}</Field>
              </dl>
              {hasButtons && actions && (
                <div className="mt-2 border-t pt-2">
                  <RowButtons user={u} actions={actions} />
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

/** Same columns and cell shapes as the real table. */
export function UsersTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <>
      <div className="hidden rounded border bg-card md:block" aria-busy="true" aria-label="Loading users">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 px-3" />
              {COLUMNS.map((c) => (
                <TableHead key={c} className={TABLE_HEAD}>
                  {c}
                </TableHead>
              ))}
              <ActionsHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, i) => (
              <TableRow key={i}>
                <TableCell className="px-3">
                  <Skeleton className="size-4 rounded" />
                </TableCell>
                <TableCell className="px-3">
                  <Skeleton className="h-3.5 w-32 rounded" />
                  <Skeleton className="mt-1.5 h-3 w-44 rounded" />
                </TableCell>
                <TableCell className="px-3">
                  <Skeleton className="h-3.5 w-24 rounded" />
                </TableCell>
                <TableCell className="px-3">
                  <Skeleton className="h-3 w-28 rounded" />
                </TableCell>
                <TableCell className="px-3">
                  <Skeleton className="h-3 w-10 rounded" />
                </TableCell>
                <TableCell className="px-3">
                  <Skeleton className="h-3 w-24 rounded" />
                </TableCell>
                <TableCell className="px-3">
                  <Skeleton className="h-4 w-14 rounded" />
                </TableCell>
                <TableCell className="px-3">
                  <Skeleton className="ml-auto h-6 w-20 rounded" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ul className="space-y-2 md:hidden" aria-busy="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i} className="space-y-2 rounded border bg-card p-3">
            <div className="flex justify-between">
              <Skeleton className="h-3.5 w-32 rounded" />
              <Skeleton className="h-4 w-14 rounded" />
            </div>
            <Skeleton className="h-3 w-44 rounded" />
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Skeleton className="h-3.5 w-24 rounded" />
              <Skeleton className="h-3.5 w-28 rounded" />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
