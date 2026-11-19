import { Head } from '@/components/ui/Head';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page/PageHeader';
import { usePermissions } from '@/contexts/PermissionContextType';
import { useGetUserPermissions } from '@/hooks/useRoleManagement';
import { formatDateTime } from '@/utils/formatDate';
import { AccountSecurityForm } from '../components/AccountSecurityForm';
import { ChangePasswordForm } from '../components/ChangePasswordForm';
import { clientScopeLabel } from '../lib/userDisplay';

/** "My account": profile, sign-in PIN channel, password. */
export default function AccountPage() {
  const { user, workspace, isOwner } = usePermissions();
  // Only the live GET /me response carries this (not the cached session).
  const pinEnabled = useGetUserPermissions().data?.pinEnabled !== false;

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <Head title="My account" />
      <PageHeader eyebrow="My account" title={user?.name ?? 'My account'} description="Your sign-in details. Your role and clients are managed by the Owner of your workspace." />

      <Card className="rounded">
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent>
          {user ? (
            <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <Detail label="Email" value={user.email} />
              <Detail label="Workspace" value={workspace ? `${workspace.name} · ${user.role ?? 'no role'}` : (user.role ?? '—')} />
              <Detail label="Clients" value={clientScopeLabel(user)} />
              <Detail label="Previous sign-in" value={user.previousLoginAt ? formatDateTime(user.previousLoginAt) : '—'} />
            </dl>
          ) : (
            <div className="grid gap-4 sm:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-16 rounded" />
                  <Skeleton className="h-4 w-36 rounded" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="rounded">
          <CardHeader>
            <CardTitle className="text-base">Two-step sign-in</CardTitle>
            <CardDescription>After your password we send a 6-digit PIN that works for 5 minutes.</CardDescription>
          </CardHeader>
          <CardContent>
            {!pinEnabled && (
              <p className="mb-4 rounded border border-warn/30 bg-warn-soft px-3 py-2 text-sm text-warn">
                The one-time PIN is switched off for everyone at the moment, so sign-in is password only. Your choice below
                applies when it is switched back on.
              </p>
            )}
            {user ? <AccountSecurityForm key={user.id} user={user} isAdmin={isOwner} /> : <SecurityFormSkeleton />}
          </CardContent>
        </Card>

        <Card className="rounded">
          <CardHeader>
            <CardTitle className="text-base">Password</CardTitle>
            <CardDescription>8+ characters with letters, numbers and a symbol.</CardDescription>
          </CardHeader>
          <CardContent>{user ? <ChangePasswordForm email={user.email} /> : <PasswordFormSkeleton />}</CardContent>
        </Card>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium" title={value}>
        {value}
      </dd>
    </div>
  );
}

/** A label line over an input box. */
function FieldSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-2">
      <Skeleton className={`h-3.5 rounded ${label}`} />
      <Skeleton className="h-9 w-full rounded" />
    </div>
  );
}

/** The two-step sign-in form while the user loads: the cell number, the PIN channel cards (radio, name, hint) and Save. */
function SecurityFormSkeleton() {
  return (
    <div className="space-y-5" aria-busy aria-label="Loading the sign-in settings">
      <div className="max-w-xs">
        <FieldSkeleton label="w-20" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-44 rounded" />
        <div className="grid gap-2 sm:grid-cols-3">
          {['w-10', 'w-8'].map((w) => (
            <div key={w} className="flex items-start gap-2.5 rounded border p-3">
              <Skeleton className="mt-0.5 size-4 shrink-0 rounded-full" />
              <span className="flex-1 space-y-1.5">
                <Skeleton className={`h-3.5 rounded ${w}`} />
                <Skeleton className="h-3 w-28 rounded" />
              </span>
            </div>
          ))}
        </div>
      </div>
      <Skeleton className="h-9 w-20 rounded" />
    </div>
  );
}

/** The change-password form while the user loads: current and new password, the rules checklist, the confirmation, the note and the button. */
function PasswordFormSkeleton() {
  return (
    <div className="max-w-md space-y-4" aria-busy aria-label="Loading the password form">
      <FieldSkeleton label="w-28" />
      <FieldSkeleton label="w-24" />
      <div className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
        {['w-28', 'w-32', 'w-24', 'w-28', 'w-36'].map((w, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <Skeleton className="size-3 rounded-full" />
            <Skeleton className={`h-3 rounded ${w}`} />
          </span>
        ))}
      </div>
      <FieldSkeleton label="w-36" />
      <Skeleton className="h-3 w-64 max-w-full rounded" />
      <Skeleton className="h-9 w-36 rounded" />
    </div>
  );
}
