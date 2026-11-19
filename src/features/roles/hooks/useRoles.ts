import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authKeys } from '@/features/auth/hooks/useAuth';
import { createRole, deleteRole, getRoleHistory, getRoles, updateRole, updateRolePermissions } from '../api/rolesApi';
import type { RoleInput } from '../types';

export const roleKeys = {
  all: ['roles'] as const,
  list: () => [...roleKeys.all, 'list'] as const,
  history: (page: number) => [...roleKeys.all, 'history', page] as const,
};

export function useRoles() {
  return useQuery({ queryKey: roleKeys.list(), queryFn: getRoles });
}

/** Also drives the count on the History button. */
export function useRoleHistory(page = 1) {
  return useQuery({
    queryKey: roleKeys.history(page),
    queryFn: () => getRoleHistory(page),
    placeholderData: keepPreviousData,
  });
}

function useInvalidateRoles() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: roleKeys.all });
    // The Users page's role picker lists roles too.
    void queryClient.invalidateQueries({ queryKey: ['users', 'options'] });
    // A change to your own role shows in the menu straight away, not only after a reload.
    void queryClient.invalidateQueries({ queryKey: authKeys.account });
  };
}

/** Create when `id` is undefined, otherwise rename / re-describe. */
export function useSaveRole() {
  const invalidate = useInvalidateRoles();
  return useMutation({
    mutationFn: ({ id, input }: { id?: number; input: RoleInput }) => (id ? updateRole(id, input) : createRole(input)),
    onSuccess: invalidate,
  });
}

export function useUpdateRolePermissions() {
  const invalidate = useInvalidateRoles();
  return useMutation({
    mutationFn: ({ id, permissions }: { id: number; permissions: string[] }) => updateRolePermissions(id, permissions),
    onSuccess: invalidate,
  });
}

export function useDeleteRole() {
  const invalidate = useInvalidateRoles();
  return useMutation({ mutationFn: (id: number) => deleteRole(id), onSuccess: invalidate });
}
