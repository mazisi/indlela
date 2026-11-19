/**
 * Capture-and-restore the page a user was on when they were *auto* logged out
 * (idle timeout or a 401), so the next login returns them there.
 *
 * Persisted to localStorage rather than router state / a query param because
 * every auto-logout path does a full-page `window.location` redirect, which
 * drops in-memory React Router state. Manual logout deliberately does NOT call
 * `saveReturnUrl`, so it falls back to the dashboard as before.
 */

const RETURN_URL_KEY = 'indlela_return_url';

/** Only the authenticated app shell is worth returning to. */
const RESTORABLE_PREFIX = '/dashboard';

/**
 * Guard against open-redirects: must resolve to a same-origin, root-relative
 * path. Uses the browser's URL parser (the authority) rather than string
 * prefix checks, so `//evil.com`, `/\evil.com` and encoded variants are caught.
 */
const isSafeInternalPath = (path: string): boolean => {
  if (typeof path !== 'string' || !path.startsWith('/')) return false;
  try {
    const url = new URL(path, window.location.origin);
    return url.origin === window.location.origin;
  } catch {
    return false;
  }
};

/**
 * Save the current location (path + query + hash) if it's a restorable app
 * page. No-op on auth pages (`/`, `/login`, …) so we never bounce a user back
 * to the login screen after they sign in.
 */
export const saveReturnUrl = (): void => {
  try {
    const current =
      window.location.pathname + window.location.search + window.location.hash;
    if (current.startsWith(RESTORABLE_PREFIX)) {
      localStorage.setItem(RETURN_URL_KEY, current);
    }
  } catch {
    /* localStorage unavailable (private mode / quota) — restore is best-effort */
  }
};

/**
 * Read and clear the saved return URL. Returns null if absent or unsafe, so the
 * caller can fall back to its default destination.
 */
export const consumeReturnUrl = (): string | null => {
  try {
    const stored = localStorage.getItem(RETURN_URL_KEY);
    localStorage.removeItem(RETURN_URL_KEY);
    // Re-assert both guards at read time (defence-in-depth): same-origin AND a
    // restorable app page, in case anything ever writes the key directly.
    return stored && isSafeInternalPath(stored) && stored.startsWith(RESTORABLE_PREFIX)
      ? stored
      : null;
  } catch {
    return null;
  }
};

/**
 * Where to go after signing in: an explicit, safe `?returnUrl=` wins, then the
 * page saved by an idle/401 logout, then the dashboard.
 */
export const resolvePostLoginDestination = (search: string): string => {
  const explicit = new URLSearchParams(search).get('returnUrl');
  if (explicit && isSafeInternalPath(explicit) && explicit.startsWith(RESTORABLE_PREFIX)) {
    consumeReturnUrl();
    return explicit;
  }
  return consumeReturnUrl() ?? RESTORABLE_PREFIX;
};
