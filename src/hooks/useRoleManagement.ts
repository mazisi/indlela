import { useQuery } from '@tanstack/react-query';
import { getAccount } from '@/features/auth/api/authApi';
import { authKeys } from '@/features/auth/hooks/useAuth';
import { session } from '@/features/auth/session';
import type { AccountResponse } from '@/features/auth/types';

/**
 * Current user + roles + permissions + workspaces (GET /me), for the
 * PermissionProvider. Seeded from the stored session so the sidebar renders
 * instantly and the refresh happens in the background.
 */
export const useGetUserPermissions = () => {
  return useQuery<AccountResponse>({
    queryKey: authKeys.account,
    queryFn: async () => {
      const data = await getAccount();
      session.update(data);
      return data;
    },
    enabled: session.token() !== null,
    initialData: () => session.state() ?? undefined,
    // Seeded data counts as stale so the real permissions are always fetched
    // once per page load: a role change made by an Owner shows up on reload.
    initialDataUpdatedAt: 0,
    staleTime: 5 * 60 * 1000,
  });
};
