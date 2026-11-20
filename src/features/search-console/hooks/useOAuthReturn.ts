import { useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import showToaster from '@/utils/showToaster';
import { scKeys } from './useSearchConsole';

/**
 * Google's consent screen returns to the API, which sends the browser back
 * here with `?google=connected` or `?google=error&message=…`. Say how it went,
 * refresh the connection and drop the params so a reload doesn't repeat it.
 */
export function useOAuthReturn() {
  const [params, setParams] = useSearchParams();
  const queryClient = useQueryClient();
  const outcome = params.get('google');
  const message = params.get('message');

  useEffect(() => {
    if (outcome !== 'connected' && outcome !== 'error') return;
    // A fixed toast id: StrictMode's second run (or a quick re-render) shows one toast, not two.
    if (outcome === 'connected') {
      showToaster('success', 'Google Search Console connected.', { id: 'google-oauth' });
      void queryClient.invalidateQueries({ queryKey: scKeys.all });
    } else {
      showToaster('error', message || 'Google did not connect. Please try again.', { id: 'google-oauth' });
    }
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('google');
        next.delete('message');
        return next;
      },
      { replace: true },
    );
  }, [outcome, message, queryClient, setParams]);
}
