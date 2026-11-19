import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router';

/** Shown alone on a page that sets no title, and appended to the ones that do. */
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Indlela';

/**
 * Clear the tab title on every navigation, for the layout to call once.
 *
 * Head only ever sets document.title, so a page that renders none kept whatever
 * the last page that did had set — landing on the Control Panel after signing in
 * left the tab reading "Sign in | <app>". React runs every layout
 * effect before any passive effect in the same commit, so this clears the title
 * before the incoming page's own Head sets it: a page with a title still wins,
 * and one without falls back to the app name rather than to a lie.
 */
export function useResetTitleOnNavigate(): void {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    document.title = APP_NAME;
  }, [pathname]);
}
