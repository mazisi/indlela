import { useQuery } from '@tanstack/react-query';
import { getPublicReport } from '../api/publicReportsApi';

/** A share link's report; a 404 (unknown, revoked or expired) isn't retried. */
export const usePublicReport = (token: string) =>
  useQuery({
    queryKey: ['public-report', token],
    queryFn: () => getPublicReport(token),
    retry: (count, error) => (error as { response?: { status?: number } }).response?.status !== 404 && count < 1,
    staleTime: Infinity,
  });
