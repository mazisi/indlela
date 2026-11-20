import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getChangeHistory, getChangeHistoryOptions, undoChange } from '../api/changeHistoryApi';
import type { ChangeHistoryQuery } from '../types';

export const changeHistoryKeys = {
  all: ['change-history'] as const,
  list: (query: ChangeHistoryQuery) => [...changeHistoryKeys.all, 'list', query] as const,
  options: () => [...changeHistoryKeys.all, 'options'] as const,
};

export function useChangeHistory(query: ChangeHistoryQuery) {
  return useQuery({
    queryKey: changeHistoryKeys.list(query),
    queryFn: () => getChangeHistory(query),
    // Keep the current page on screen while the next one loads.
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}

export function useChangeHistoryOptions() {
  return useQuery({ queryKey: changeHistoryKeys.options(), queryFn: getChangeHistoryOptions, staleTime: 5 * 60 * 1000 });
}

/**
 * Undo an entry. Anything cached may now be out of date (the record lives on
 * another page), so every query is refreshed, not only this list.
 */
export function useUndoChange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => undoChange(id),
    onSuccess: () => queryClient.invalidateQueries(),
  });
}
