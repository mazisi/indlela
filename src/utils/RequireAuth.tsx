import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { session, useIsSignedIn } from '@/features/auth/session';

/**
 * Route guards. Token presence is the source of truth (see features/auth/session):
 * guarding on anything else while the token is cleared is what caused
 * bee-compliance's /login ↔ /dashboard bounce loop.
 */
export const RequireAuth = ({ children }: { children: ReactNode }) => {
  const signedIn = useIsSignedIn();
  const location = useLocation();

  if (!signedIn) {
    // The guard is the one place that leaves the app when a session ends, so
    // a sign-out never races a second redirect.
    if (session.endReason() === 'signed_out') {
      return <Navigate to="/login" replace state={{ notice: 'You have been signed out.' }} />;
    }
    const returnUrl = encodeURIComponent(location.pathname + location.search + location.hash);
    return <Navigate to={`/login?returnUrl=${returnUrl}`} replace />;
  }

  return children;
};

/** Public auth pages: a signed-in user goes straight to the app. */
export const RedirectIfSignedIn = ({ children }: { children: ReactNode }) => {
  const signedIn = useIsSignedIn();
  return signedIn ? <Navigate to="/dashboard" replace /> : children;
};
