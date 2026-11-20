import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getPlatformUsage, getWorkspaceUsage, updateWorkspaceLimit } from '../api/platformApi';
import type { WorkspaceUsageQuery } from '../types';

export const platformKeys = {
  all: ['platform'] as const,
  usage: () => [...platformKeys.all, 'usage'] as const,
  workspaces: () => [...platformKeys.all, 'workspaces'] as const,
  workspaceList: (query: WorkspaceUsageQuery) => [...platformKeys.workspaces(), query] as const,
};

export const usePlatformUsage = () => useQuery({ queryKey: platformKeys.usage(), queryFn: getPlatformUsage, staleTime: 60_000 });

export const useWorkspaceUsage = (query: WorkspaceUsageQuery) =>
  useQuery({ queryKey: platformKeys.workspaceList(query), queryFn: () => getWorkspaceUsage(query), placeholderData: keepPreviousData });

/** Saves a workspace's keyword limit, then re-reads the list (its order may change) and the totals. */
export const useUpdateWorkspaceLimit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, limit }: { id: number; limit: number | null }) => updateWorkspaceLimit(id, limit),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: platformKeys.all }),
  });
};
