import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authKeys } from '@/features/auth/hooks/useAuth';
import { getWorkspace, getWorkspaceHistory, updateWorkspace } from '../api/workspaceApi';

export const workspaceKeys = {
  all: ['workspace'] as const,
  current: () => [...workspaceKeys.all, 'current'] as const,
  history: (page: number) => [...workspaceKeys.all, 'history', page] as const,
};

export const useWorkspace = () => useQuery({ queryKey: workspaceKeys.current(), queryFn: getWorkspace });

export const useWorkspaceHistory = (page = 1) =>
  useQuery({ queryKey: workspaceKeys.history(page), queryFn: () => getWorkspaceHistory(page), placeholderData: keepPreviousData });

/** The name and logo also show in the sidebar's switcher (GET /me), so that refreshes too. */
export function useUpdateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateWorkspace,
    onSuccess: (workspace) => {
      queryClient.setQueryData(workspaceKeys.current(), workspace);
      void queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
      void queryClient.invalidateQueries({ queryKey: authKeys.account });
    },
  });
}
