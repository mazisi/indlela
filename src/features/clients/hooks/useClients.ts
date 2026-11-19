import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ActiveBulkAction } from '@/components/table/ActiveBulkBar';
import { authKeys } from '@/features/auth/hooks/useAuth';
import { bulkUpdateClients, deleteClient, getClientHistory, getClients, saveClient } from '../api/clientsApi';
import type { ClientInput, ClientsQuery } from '../types';

export const clientKeys = {
  all: ['clients'] as const,
  list: (query: ClientsQuery) => [...clientKeys.all, 'list', query] as const,
  history: (page: number) => [...clientKeys.all, 'history', page] as const,
};

export const useClients = (query: ClientsQuery) =>
  useQuery({ queryKey: clientKeys.list(query), queryFn: () => getClients(query), placeholderData: keepPreviousData });

/** Also drives the count on the History button, so it loads with the page. */
export const useClientHistory = (page = 1) =>
  useQuery({ queryKey: clientKeys.history(page), queryFn: () => getClientHistory(page), placeholderData: keepPreviousData });

/**
 * A client change also changes the client pickers (Sites, Users' client
 * access) and the signed-in user's own client list (GET /me), and site rows
 * show the client's name.
 */
function useInvalidatingMutation<V, R>(fn: (vars: V) => Promise<R>, refreshOnError = false) {
  const queryClient = useQueryClient();
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: clientKeys.all });
    void queryClient.invalidateQueries({ queryKey: ['sites'] });
    void queryClient.invalidateQueries({ queryKey: ['users', 'options'] });
    void queryClient.invalidateQueries({ queryKey: authKeys.account });
  };
  return useMutation({ mutationFn: fn, onSuccess: refresh, onError: refreshOnError ? refresh : undefined });
}

export const useSaveClient = () => useInvalidatingMutation(({ id, input }: { id?: number; input: ClientInput }) => saveClient(id, input));

export const useDeleteClient = () => useInvalidatingMutation((id: number) => deleteClient(id));

/** Refreshes even on failure: a 409/422 can mean the list is out of date. */
export const useBulkUpdateClients = () =>
  useInvalidatingMutation(({ action, ids }: { action: ActiveBulkAction; ids: number[] }) => bulkUpdateClients(action, ids), true);
