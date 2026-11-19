import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { RedirectIfSignedIn, RequireAuth } from './RequireAuth';
import { session, STORAGE_KEYS } from '@/features/auth/session';
import { renderAt } from '@/test/renderWithProviders';

describe('route guards', () => {
  it('sends a signed-out visitor to /login with a returnUrl', () => {
    renderAt('/dashboard/leave?tab=register', [
      { path: '/dashboard/leave', element: <RequireAuth><p>Leave</p></RequireAuth> },
    ]);

    expect(screen.queryByText('Leave')).not.toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/login?returnUrl=%2Fdashboard%2Fleave%3Ftab%3Dregister');
  });

  it('lets a signed-in user through', () => {
    localStorage.setItem(STORAGE_KEYS.token, JSON.stringify('1|abc'));
    renderAt('/dashboard', [{ path: '/dashboard', element: <RequireAuth><p>Home</p></RequireAuth> }]);

    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('keeps signed-in users off the sign-in page', () => {
    localStorage.setItem(STORAGE_KEYS.token, JSON.stringify('1|abc'));
    renderAt('/login', [{ path: '/login', element: <RedirectIfSignedIn><p>Sign in</p></RedirectIfSignedIn> }]);

    expect(screen.getByTestId('location')).toHaveTextContent('/dashboard');
  });

  it('session.clear() removes everything it stored', () => {
    localStorage.setItem(STORAGE_KEYS.token, JSON.stringify('1|abc'));
    localStorage.setItem(STORAGE_KEYS.permissions, JSON.stringify(['view_leave']));
    session.clear();

    expect(session.token()).toBeNull();
    expect(session.permissions()).toBeNull();
  });
});

describe('sign-out redirect', () => {
  it('an intentional sign-out goes to /login without a returnUrl', () => {
    localStorage.setItem(STORAGE_KEYS.token, JSON.stringify('1|abc'));
    session.clear('signed_out');
    renderAt('/dashboard/account', [{ path: '/dashboard/account', element: <RequireAuth><p>Account</p></RequireAuth> }]);

    expect(screen.getByTestId('location')).toHaveTextContent(/^\/login$/);
  });
});
