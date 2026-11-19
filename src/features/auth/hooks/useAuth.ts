import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as authApi from '../api/authApi';
import { session } from '../session';
import type { AccountState, LoginResult, SignedIn } from '../types';

export const authKeys = {
  account: ['me'] as const,
};

/** The cached GET /me body, from a sign-in or switch response. */
const accountOf = (state: AccountState): AccountState => ({
  user: state.user,
  roles: state.roles,
  permissions: state.permissions,
  workspace: state.workspace,
  workspaces: state.workspaces,
});

/** Persist a finished sign-in and prime the permissions cache. */
function useStartSession() {
  const queryClient = useQueryClient();
  return (result: SignedIn) => {
    session.start(result);
    queryClient.setQueryData(authKeys.account, accountOf(result));
  };
}

export function useLogin() {
  const startSession = useStartSession();
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (result: LoginResult) => {
      if (!result.requiresMfa) startSession(result);
    },
  });
}

export function useVerifyPin() {
  const startSession = useStartSession();
  return useMutation({
    mutationFn: authApi.verifyPin,
    onSuccess: (result: LoginResult) => {
      if (!result.requiresMfa) startSession(result);
    },
  });
}

export function useResendPin() {
  return useMutation({ mutationFn: authApi.resendPin });
}

export function useForgotPassword() {
  return useMutation({ mutationFn: authApi.forgotPassword });
}

export function useResetPassword() {
  return useMutation({ mutationFn: authApi.resetPassword });
}

/** Create a workspace: signed in as its Owner straight away. */
export function useRegister() {
  const startSession = useStartSession();
  return useMutation({ mutationFn: authApi.register, onSuccess: startSession });
}

/**
 * Sign out: revoke the token server-side, then clear the browser session
 * whatever the server said (an already-dead token must still sign out).
 * No navigate here: RequireAuth sees the ended session and redirects to
 * /login with the notice. (Navigating as well races the guard's redirect,
 * because react-router navigations are transitions and the session store
 * update is synchronous.)
 */
export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      session.clear('signed_out');
      queryClient.clear();
    },
  });
}

/**
 * Switch workspace: same token, new roles/permissions/clients. Every cached
 * query belonged to the old workspace, so the whole cache goes; /me is seeded
 * with the switch response so the sidebar redraws at once.
 */
export function useSwitchWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.switchWorkspace,
    onSuccess: (state) => {
      session.update(state);
      queryClient.clear();
      queryClient.setQueryData(authKeys.account, accountOf(state));
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.updateAccount,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: authKeys.account }),
  });
}

export function useChangePassword() {
  return useMutation({ mutationFn: authApi.changePassword });
}
