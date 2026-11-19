import { useState } from 'react';
import { Link } from 'react-router';
import { LogOut, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { usePermissions } from '@/contexts/PermissionContextType';
import { useLogout } from '@/features/auth/hooks/useAuth';
import { useGetUserPermissions } from '@/hooks/useRoleManagement';
import { initials } from '@/features/auth/lib/userDisplay';
import { LogoutConfirmationDialog } from '@/components/dashboard/LogoutConfirmationDialog';

/** Who is signed in, with My account / Sign out . */
export function SidebarUserCard({ collapsed }: { collapsed: boolean }) {
  const { user, workspace } = usePermissions();
  const logout = useLogout();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const pinOnSignIn = useGetUserPermissions().data?.pinEnabled !== false && user?.mfaChannel !== 'off';

  const dialog = (
    <LogoutConfirmationDialog open={confirmOpen} onOpenChange={setConfirmOpen} onConfirm={() => logout.mutate()} pending={logout.isPending} pinOnSignIn={pinOnSignIn} />
  );

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1.5 py-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/dashboard/account"
              className="flex size-9 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white"
              aria-label="My account"
            >
              {user ? initials(user) : '…'}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">{user?.name}</TooltipContent>
        </Tooltip>
        <Button variant="ghost" size="icon" onClick={() => setConfirmOpen(true)} aria-label="Sign out">
          <LogOut />
        </Button>
        {dialog}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{user?.name ?? '…'}</p>
        <p className="text-xs leading-snug text-muted-foreground">
          {user?.role ?? ''}
          {workspace && ` · ${workspace.name}`}
        </p>
      </div>
      <div className="flex gap-2">
        <Button asChild variant="outline" size="sm" className="flex-1 bg-card">
          <Link to="/dashboard/account">
            <UserRound />
            My account
          </Link>
        </Button>
        <Button variant="outline" size="sm" className="flex-1 bg-card" onClick={() => setConfirmOpen(true)}>
          <LogOut />
          Sign out
        </Button>
      </div>
      {dialog}
    </div>
  );
}
