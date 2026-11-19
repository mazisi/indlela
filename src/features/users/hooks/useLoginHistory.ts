import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getLoginHistory } from '../api/loginHistoryApi';
import type { LoginHistoryQuery } from '../types';

export const loginHistoryKeys = {
  all: ['login-history'] as const,
  list: (query: LoginHistoryQuery) => [...loginHistoryKeys.all, query] as const,
};

export function useLoginHistory(query: LoginHistoryQuery) {
  return useQuery({
    queryKey: loginHistoryKeys.list(query),
    queryFn: () => getLoginHistory(query),
    // Keep the current page on screen while the next one loads.
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}
