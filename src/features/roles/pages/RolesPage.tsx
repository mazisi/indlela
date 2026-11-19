import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { ChevronsDownUp, ChevronsUpDown, Loader2, Plus, ShieldCheck } from 'lucide-react';
import { Head } from '@/components/ui/Head';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { PageHeader } from '@/components/page/PageHeader';
import { ChangeHistorySheet } from '@/components/history/ChangeHistorySheet';
import { usePermissions } from '@/contexts/PermissionContextType';
import { FormAlert } from '@/features/auth/components/FormAlert';
import showToaster from '@/utils/showToaster';
import { getApiErrorMessage } from '@/utils/formErrorHandler';
import { PermissionGroup, PermissionGroupsSkeleton } from '../components/PermissionGroup';
import { RoleFormSheet } from '../components/RoleFormSheet';
import { RolePicker } from '../components/RolePicker';
import { useDeleteRole, useRoleHistory, useRoles, useUpdateRolePermissions } from '../hooks/useRoles';
import { sameSet } from '../lib/permissions';
import type { Role } from '../types';

const PAGE_TITLE = 'Roles and permissions';

/** Unsaved grid changes, tied to the role they were made on. */
interface Draft {
  roleId: number | null;
  held: Set<string> | null;
}

const NO_DRAFT: Draft = { roleId: null, held: null };

/**
 * Settings › Roles and permissions (Owners). Ported from workforce-app
 * (itself from bee-compliance's Roles tab): pick a role, tick what it can do on each page
 * (grouped like the sidebar), save. The selected role lives in the URL (?role=…).
 */
export default function RolesPage() {
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission('create_settings_roles');
  const canUpdate = hasPermission('update_settings_roles');
  const canDelete = hasPermission('delete_settings_roles');

  const query = useRoles();
  const savePermissions = useUpdateRolePermissions();
  const deleteRole = useDeleteRole();
  const [historyPage, setHistoryPage] = useState(1);
  const history = useRoleHistory(historyPage);

  const [params, setParams] = useSearchParams();
  const roles = query.data?.roles ?? [];
  const groups = query.data?.groups ?? [];
  // Default to the first role other than Owner.
  const role =
    roles.find((r) => String(r.id) === params.get('role')) ?? roles.find((r) => !r.isSystem) ?? roles[0] ?? null;

  const [draft, setDraft] = useState<Draft>(NO_DRAFT);
  const saved = new Set(role?.permissions ?? []);
  const held = role && draft.roleId === role.id && draft.held ? draft.held : saved;
  const isDirty = !sameSet(held, saved);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [sheet, setSheet] = useState<{ open: boolean; role?: Role }>({ open: false });
  const [historyOpen, setHistoryOpen] = useState(false);
  const [confirm, setConfirm] = useState<{ kind: 'discard'; roleId: number } | { kind: 'delete' } | null>(null);

  const selectRole = (roleId: number) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('role', String(roleId));
      return next;
    });
    setDraft(NO_DRAFT);
  };

  const onSelect = (roleId: number) => (isDirty ? setConfirm({ kind: 'discard', roleId }) : selectRole(roleId));

  const toggleExpanded = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const save = async () => {
    if (!role) return;
    // Only pages a role can be given are sent; Users, Roles and Login history stay with administrators.
    const grantable = new Set(groups.flatMap((g) => g.resources.filter((r) => r.grantable).flatMap((r) => r.actions.map((a) => `${a}_${r.key}`))));
    try {
      await savePermissions.mutateAsync({ id: role.id, permissions: [...held].filter((p) => grantable.has(p)) });
      setDraft(NO_DRAFT);
      showToaster('success', `${role.name} saved. Its users have the new access straight away.`);
    } catch (error) {
      showToaster('error', getApiErrorMessage(error, 'Could not save the permissions.'));
    }
  };

  const confirmDelete = async () => {
    if (!role) return;
    try {
      await deleteRole.mutateAsync(role.id);
      showToaster('success', `${role.name} deleted.`);
      setParams({}, { replace: true });
    } catch (error) {
      showToaster('error', getApiErrorMessage(error, 'Could not delete the role.'));
    }
    setConfirm(null);
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <Head title={PAGE_TITLE} />
      {/* The title, the role bar and Expand / Collapse all stay on top while the permissions scroll under them. */}
      <div className="sticky top-0 z-20 -mx-4 -mt-4 space-y-3 border-b bg-background/95 px-4 pt-4 pb-2 backdrop-blur sm:-mx-6 sm:-mt-6 sm:px-6 sm:pt-6">
        <PageHeader
          eyebrow="Settings · Owner"
          title={PAGE_TITLE}
          description="What each role can do on each page, grouped like the sidebar. Every action needs View; Approve covers sign-offs and approvals. Pages marked Owner only can't be given to another role. Roles are per workspace."
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setHistoryPage(1);
                  setHistoryOpen(true);
                }}
                title="Who changed what on this page, and when"
              >
                History
                {history.data && (
                  <span className="rounded bg-secondary px-1.5 text-xs tabular-nums text-muted-foreground">{history.data.meta.total}</span>
                )}
              </Button>
              {canCreate && (
                <Button onClick={() => setSheet({ open: true })}>
                  <Plus />
                  Add role
                </Button>
              )}
            </div>
          }
        />
        {role && !query.isError && (
          <>
            <RolePicker
              roles={roles}
              role={role}
              onSelect={onSelect}
              canUpdate={canUpdate}
              canDelete={canDelete}
              isDirty={isDirty}
              onEdit={() => setSheet({ open: true, role })}
              onDelete={() => setConfirm({ kind: 'delete' })}
              onReset={() => setDraft(NO_DRAFT)}
            />
            <div className="flex justify-end gap-1">
              <Button variant="ghost" size="sm" onClick={() => setExpanded(new Set(groups.map((g) => g.key)))}>
                <ChevronsUpDown />
                Expand all
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setExpanded(new Set())}>
                <ChevronsDownUp />
                Collapse all
              </Button>
            </div>
          </>
        )}
      </div>

      {query.isError ? (
        <FormAlert tone="error">
          <p>We could not load the roles.</p>
          <p>
            <button type="button" className="font-medium underline" onClick={() => query.refetch()}>
              Try again
            </button>
          </p>
        </FormAlert>
      ) : query.isPending || !role ? (
        <>
          {/* The role picker: Role and its select, the description, the buttons. */}
          <div className="flex flex-col gap-3 rounded border bg-card p-3 sm:flex-row sm:items-center" aria-busy="true" aria-label="Loading the roles">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3.5 w-8 rounded" />
              <Skeleton className="h-9 w-full rounded sm:w-64" />
            </div>
            <Skeleton className="h-3.5 w-72 max-w-full rounded sm:mr-auto" />
            <div className="flex gap-1.5">
              <Skeleton className="h-8 w-24 rounded" />
              <Skeleton className="h-8 w-20 rounded" />
            </div>
          </div>
          <PermissionGroupsSkeleton />
        </>
      ) : (
        <>
          {role.isSystem && (
            <p className="flex items-center gap-2 rounded border bg-accent/50 px-3 py-2 text-sm">
              <ShieldCheck className="size-4 shrink-0 text-primary" aria-hidden />
              Owners always have full access to the workspace, so this role can't be changed.
            </p>
          )}

          <div className="space-y-2">
            {groups.map((g) => (
              <PermissionGroup
                key={g.key}
                group={g}
                held={held}
                readOnly={!canUpdate || role.isSystem}
                expanded={expanded.has(g.key)}
                onToggleExpand={() => toggleExpanded(g.key)}
                onChange={(next) => setDraft({ roleId: role.id, held: next })}
              />
            ))}
          </div>

          {canUpdate && !role.isSystem && (
            <div className="sticky bottom-0 -mx-4 border-t bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
              <div className="flex items-center justify-end gap-3">
                {isDirty && <span className="text-xs font-medium text-warn">Unsaved changes to {role.name}</span>}
                <Button onClick={save} disabled={!isDirty || savePermissions.isPending}>
                  {savePermissions.isPending && <Loader2 className="animate-spin" />}
                  Save
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {(canCreate || canUpdate) && (
        <RoleFormSheet
          open={sheet.open}
          onOpenChange={(open) => setSheet((s) => ({ ...s, open }))}
          role={sheet.role}
          onSaved={(r, created) => created && selectRole(r.id)}
        />
      )}
      <ConfirmationDialog
        open={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
        variant="danger"
        title={confirm?.kind === 'discard' ? `Discard changes to ${role?.name}?` : `Delete ${role?.name}?`}
        description={
          confirm?.kind === 'discard'
            ? 'The permissions you changed on this role have not been saved.'
            : 'The role is removed from the list and from the registration form. Its change history is kept.'
        }
        confirmLabel={confirm?.kind === 'discard' ? 'Discard' : 'Delete'}
        isLoading={deleteRole.isPending}
        onConfirm={() => {
          if (confirm?.kind === 'discard') {
            selectRole(confirm.roleId);
            setConfirm(null);
          } else {
            void confirmDelete();
          }
        }}
      />
      <ChangeHistorySheet
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        pageTitle={PAGE_TITLE}
        history={history.data}
        isPending={history.isPending}
        isError={history.isError}
        onRetry={() => history.refetch()}
        onPageChange={setHistoryPage}
        fieldLabels={{
          name: 'Role name',
          description: 'Description',
          ...Object.fromEntries(groups.flatMap((g) => g.resources.map((r) => [r.key, g.resources.length > 1 ? `${g.label} › ${r.label}` : r.label]))),
        }}
      />
    </div>
  );
}
