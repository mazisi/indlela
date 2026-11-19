import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { Plus, Search, Users, X } from 'lucide-react';
import { Head } from '@/components/ui/Head';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { PageHeader } from '@/components/page/PageHeader';
import { Paginator } from '@/components/Paginator';
import { ChangeHistorySheet } from '@/components/history/ChangeHistorySheet';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useRowSelection } from '@/hooks/useRowSelection';
import { usePermissions } from '@/contexts/PermissionContextType';
import { FormAlert } from '@/features/auth/components/FormAlert';
import { DEFAULT_PER_PAGE } from '@/types/pagination';
import showToaster from '@/utils/showToaster';
import { getApiErrorMessage } from '@/utils/formErrorHandler';
import { UsersTable, UsersTableSkeleton } from '../components/UsersTable';
import { UsersBulkBar } from '../components/UsersBulkBar';
import { UserFormSheet } from '../components/UserFormSheet';
import { UserStatusTabs } from '../components/UserStatusTabs';
import {
  useBulkUpdateUsers,
  useDeleteUser,
  useSendPasswordReset,
  useUnlockUser,
  useUserHistory,
  useUsers,
} from '../hooks/useUsers';
import { BULK_DONE, confirmText, plural, type Confirm } from '../lib/userConfirmations';
import type { AppUser, BulkUserAction, UserStatus } from '../types';

const PAGE_TITLE = 'Users and access';

const FIELD_LABELS: Record<string, string> = {
  full_name: 'First name',
  surname: 'Surname',
  email: 'Email',
  mobile: 'Cell',
  mfa_channel: 'One-time PIN by',
  status: 'Status',
  role: 'Role',
  clients: 'Client access',
};

/**
 * Settings › Users and access (Owners): every user of the current workspace
 * with search, status tabs and actions. No registration approvals: sign-up
 * creates a new workspace, and people join one only when an Owner adds them.
 * Search, status and page live in the URL.
 */
export default function UsersPage() {
  const { hasPermission } = usePermissions();
  const can = {
    create: hasPermission('create_settings_users'),
    update: hasPermission('update_settings_users'),
    delete: hasPermission('delete_settings_users'),
  };

  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page')) || 1;
  const perPage = Number(params.get('perPage')) || DEFAULT_PER_PAGE;
  const status = (params.get('status') as UserStatus | null) ?? undefined;
  const [searchInput, setSearchInput] = useState(params.get('search') ?? '');
  const search = useDebouncedValue(searchInput.trim(), 350);

  const update = (changes: Record<string, string | number | undefined>) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(changes).forEach(([k, v]) => (v === undefined || v === '' ? next.delete(k) : next.set(k, String(v))));
        return next;
      },
      { replace: true },
    );

  // Keep the URL in step with the debounced search, restarting at page 1.
  if (search !== (params.get('search') ?? '')) update({ search: search || undefined, page: undefined });

  const query = useUsers({ page, perPage, search: params.get('search') ?? undefined, status });
  const users = query.data?.data ?? [];
  const meta = query.data?.meta;
  const [historyPage, setHistoryPage] = useState(1);
  const history = useUserHistory(historyPage);

  // You can't disable or delete yourself, so your own row is never selectable.
  const selection = useRowSelection(
    users.filter((u) => !u.isYou).map((u) => u.id),
    params.toString(),
  );
  const bulk = useBulkUpdateUsers();
  const deleteUser = useDeleteUser();
  const unlock = useUnlockUser();
  const reset = useSendPasswordReset();

  const [sheet, setSheet] = useState<{ open: boolean; user?: AppUser }>({ open: false });
  const [historyOpen, setHistoryOpen] = useState(false);
  const [confirm, setConfirm] = useState<Confirm>(null);

  const run = async (work: () => Promise<unknown>, success: string, failure: string) => {
    try {
      await work();
      showToaster('success', success);
      return true;
    } catch (error) {
      showToaster('error', getApiErrorMessage(error, failure));
      return false;
    }
  };

  const runBulk = async (action: BulkUserAction, ids: number[]) => {
    const ok = await run(() => bulk.mutateAsync({ action, ids }), `${plural(ids.length)} ${BULK_DONE[action]}.`, 'Could not update the selected users.');
    if (ok) selection.clear();
  };

  const onConfirm = async () => {
    if (!confirm) return;
    if (confirm.kind === 'delete') {
      await run(() => deleteUser.mutateAsync(confirm.user.id), `${confirm.user.name} deleted.`, 'Could not delete the user.');
    } else if (confirm.kind === 'reset') {
      await run(() => reset.mutateAsync(confirm.user.id), `A reset link was emailed to ${confirm.user.email}.`, 'Could not send the reset link.');
    } else {
      await runBulk(confirm.action, confirm.ids);
    }
    setConfirm(null);
  };

  const filtered = Boolean(params.get('search') || status);

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <Head title={PAGE_TITLE} />
      <PageHeader
        eyebrow="Settings · Owner"
        title={PAGE_TITLE}
        description="Who can sign in to this workspace, with which role and for which clients."
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
              {history.data && <span className="rounded bg-secondary px-1.5 text-xs tabular-nums text-muted-foreground">{history.data.meta.total}</span>}
            </Button>
            {can.create && (
              <Button onClick={() => setSheet({ open: true })}>
                <Plus />
                Add user
              </Button>
            )}
          </div>
        }
      />

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative lg:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name, email or role"
            aria-label="Search name, email or role"
            className="pl-9"
          />
        </div>
        <UserStatusTabs value={status} summary={query.data?.summary} onChange={(s) => update({ status: s, page: undefined })} />
        {filtered && (
          <Button
            variant="ghost"
            size="sm"
            className="self-start lg:self-auto"
            onClick={() => {
              setSearchInput('');
              update({ search: undefined, status: undefined, page: undefined });
            }}
          >
            <X />
            Clear filters
          </Button>
        )}
      </div>

      {query.isError ? (
        <FormAlert tone="error">
          <p>We could not load the users.</p>
          <p>
            <button type="button" className="font-medium underline" onClick={() => query.refetch()}>
              Try again
            </button>
          </p>
        </FormAlert>
      ) : query.isPending ? (
        <UsersTableSkeleton />
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded border border-dashed bg-card px-6 py-14 text-center">
          <Users className="size-6 text-muted-foreground" aria-hidden />
          <p className="text-sm font-medium">{filtered ? 'No users match' : 'No users yet'}</p>
          <p className="text-sm text-muted-foreground">{filtered ? 'Try another name, email, role or status.' : 'Add the people who need access.'}</p>
        </div>
      ) : (
        <div className={query.isFetching ? 'space-y-2 opacity-60 transition-opacity' : 'space-y-2 transition-opacity'}>
          {(can.update || can.delete) && selection.count > 0 && (
            <UsersBulkBar
              count={selection.count}
              canUpdate={can.update}
              canDelete={can.delete}
              pending={bulk.isPending ? bulk.variables?.action : undefined}
              onAction={(action) => (action === 'enable' ? runBulk(action, selection.ids) : setConfirm({ kind: 'bulk', action, ids: selection.ids }))}
              onClear={selection.clear}
            />
          )}
          <UsersTable
            users={users}
            actions={{
              onEdit: can.update ? (user) => setSheet({ open: true, user }) : undefined,
              onDelete: can.delete ? (user) => setConfirm({ kind: 'delete', user }) : undefined,
              onUnlock: can.update
                ? (user) => void run(() => unlock.mutateAsync(user.id), `${user.name} is unlocked.`, 'Could not unlock the account.')
                : undefined,
              onResetPassword: can.update ? (user) => setConfirm({ kind: 'reset', user }) : undefined,
              selection: can.update || can.delete ? selection : undefined,
            }}
          />
          {meta && (
            <Paginator
              currentPage={meta.currentPage}
              lastPage={meta.lastPage}
              totalItems={meta.total}
              perPage={meta.perPage}
              onPageChange={(p) => update({ page: p === 1 ? undefined : p })}
              onPerPageChange={(n) => update({ perPage: n === DEFAULT_PER_PAGE ? undefined : n, page: undefined })}
            />
          )}
        </div>
      )}

      {(can.create || can.update) && (
        <UserFormSheet open={sheet.open} onOpenChange={(open) => setSheet((s) => ({ ...s, open }))} user={sheet.user} />
      )}
      <ConfirmationDialog
        open={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
        variant={confirm?.kind === 'reset' ? 'default' : 'danger'}
        {...confirmText(confirm)}
        isLoading={deleteUser.isPending || reset.isPending || bulk.isPending}
        onConfirm={onConfirm}
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
        fieldLabels={FIELD_LABELS}
      />
    </div>
  );
}
