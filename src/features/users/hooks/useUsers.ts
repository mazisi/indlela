import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { loginHistoryKeys } from './useLoginHistory';
import {
  bulkUpdateUsers,
  createUser,
  deleteUser,
  getUserHistory,
  getUserOptions,
  getUsers,
  sendPasswordReset,
  unlockUser,
  updateUser,
} from '../api/usersApi';
import type { BulkUserAction, UserInput, UsersQuery } from '../types';

export const userKeys = {
  all: ['users'] as const,
  list: (query: UsersQuery) => [...userKeys.all, 'list', query] as const,
  options: () => [...userKeys.all, 'options'] as const,
  history: (page: number) => [...userKeys.all, 'history', page] as const,
};

export function useUsers(query: UsersQuery) {
  return useQuery({ queryKey: userKeys.list(query), queryFn: () => getUsers(query), placeholderData: keepPreviousData });
}

export function useUserOptions(enabled = true) {
  return useQuery({ queryKey: userKeys.options(), queryFn: getUserOptions, enabled, staleTime: 5 * 60 * 1000 });
}

export function useUserHistory(page = 1) {
  return useQuery({ queryKey: userKeys.history(page), queryFn: () => getUserHistory(page), placeholderData: keepPreviousData });
}

/** Users and login history move together. */
function useInvalidateUsers() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: userKeys.all });
    void queryClient.invalidateQueries({ queryKey: loginHistoryKeys.all });
  };
}

/** Create when `id` is undefined, otherwise update. */
export function useSaveUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: ({ id, input }: { id?: number; input: UserInput }) => (id ? updateUser(id, input) : createUser(input)),
    onSuccess: invalidate,
  });
}

export function useDeleteUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({ mutationFn: (id: number) => deleteUser(id), onSuccess: invalidate });
}

export function useBulkUpdateUsers() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: ({ action, ids }: { action: BulkUserAction; ids: number[] }) => bulkUpdateUsers(action, ids),
    // A 422 can mean the list is out of date, so refresh either way.
    onSettled: invalidate,
  });
}

export function useUnlockUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({ mutationFn: (id: number) => unlockUser(id), onSuccess: invalidate });
}

export function useSendPasswordReset() {
  const invalidate = useInvalidateUsers();
  return useMutation({ mutationFn: (id: number) => sendPasswordReset(id), onSuccess: invalidate });
}
