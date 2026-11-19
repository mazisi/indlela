import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from './LoginPage';
import * as authApi from '../api/authApi';
import { session } from '../session';
import { apiError, renderAt } from '@/test/renderWithProviders';
import type { PinChallenge, SignedIn } from '../types';

vi.mock('../api/authApi');

const signedIn: SignedIn = {
  requiresMfa: false,
  message: 'Login successful',
  tokenType: 'Bearer',
  token: '1|abc',
  roles: ['Analyst'],
  permissions: ['view_dashboard'],
  user: {
    id: 3,
    name: 'Nomsa Dube',
    fullName: 'Nomsa',
    surname: 'Dube',
    email: 'nomsa@example.co.za',
    mobile: '0825550102',
    mfaChannel: 'email',
    role: 'Analyst',
    previousLoginAt: null,
    seesAllClients: false,
    clients: [{ id: 1, name: 'Karoo Coffee' }],
  },
  workspace: { id: 1, name: 'Acme Digital', slug: 'acme-digital', logoUrl: null },
  workspaces: [{ id: 1, name: 'Acme Digital', slug: 'acme-digital', logoUrl: null, role: 'Analyst' }],
};

const challenge: PinChallenge = {
  requiresMfa: true,
  message: 'Enter the one-time PIN we sent you.',
  challengeToken: 'x'.repeat(64),
  channel: 'email',
  destination: 'n•••@example.co.za',
  expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
  resendAvailableIn: 30,
};

const renderLogin = (path = '/login') => renderAt(path, [{ path: '/login', element: <LoginPage /> }]);

async function submitCredentials(password = 'Demo@2026') {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Email'), 'nomsa@example.co.za');
  await user.type(screen.getByLabelText('Password'), password);
  await user.click(screen.getByRole('button', { name: /sign in/i }));
  return user;
}

describe('LoginPage', () => {
  beforeEach(() => vi.resetAllMocks());

  it('validates before calling the API', async () => {
    renderLogin();
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Enter your email address.')).toBeInTheDocument();
    expect(authApi.login).not.toHaveBeenCalled();
  });

  it('signs straight in when 2FA is off and honours a safe returnUrl', async () => {
    vi.mocked(authApi.login).mockResolvedValue(signedIn);
    renderLogin('/login?returnUrl=%2Fdashboard%2Fclients%2Fsites');

    await submitCredentials();

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/dashboard/clients/sites'));
    expect(session.token()).toBe('1|abc');
    expect(session.permissions()).toEqual(['view_dashboard']);
  });

  it('ignores an off-site returnUrl', async () => {
    vi.mocked(authApi.login).mockResolvedValue(signedIn);
    renderLogin('/login?returnUrl=%2F%2Fevil.example%2Fdashboard');

    await submitCredentials();

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(/^\/dashboard$/));
  });

  it('asks for the PIN, then signs in with it', async () => {
    vi.mocked(authApi.login).mockResolvedValue(challenge);
    vi.mocked(authApi.verifyPin).mockResolvedValue(signedIn);
    renderLogin();

    const user = await submitCredentials();

    expect(await screen.findByText('Enter your one-time PIN')).toBeInTheDocument();
    expect(screen.getByText('n•••@example.co.za')).toBeInTheDocument();
    expect(session.token()).toBeNull();

    await user.keyboard('482913');

    await waitFor(() => expect(authApi.verifyPin).toHaveBeenCalledWith({ challengeToken: challenge.challengeToken, code: '482913' }, expect.anything()));
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/dashboard'));
    expect(session.token()).toBe('1|abc');
  });

  it('shows the tries left after a wrong PIN', async () => {
    vi.mocked(authApi.login).mockResolvedValue(challenge);
    vi.mocked(authApi.verifyPin).mockRejectedValue(
      apiError(422, { message: 'That code is not correct.', error_type: 'invalid_pin', attempts_left: 2 }),
    );
    renderLogin();

    const user = await submitCredentials();
    await screen.findByText('Enter your one-time PIN');
    await user.keyboard('000000');

    expect(await screen.findByText('That code is not correct. 2 tries left.')).toBeInTheDocument();
  });

  it('goes back to the password step when the challenge closes', async () => {
    vi.mocked(authApi.login).mockResolvedValue(challenge);
    vi.mocked(authApi.verifyPin).mockRejectedValue(
      apiError(422, { message: 'Too many wrong codes. Sign in again.', error_type: 'challenge_closed' }),
    );
    renderLogin();

    const user = await submitCredentials();
    await screen.findByText('Enter your one-time PIN');
    await user.keyboard('000000');

    expect(await screen.findByText('Too many wrong codes. Sign in again.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('offers a reset when the account is locked', async () => {
    vi.mocked(authApi.login).mockRejectedValue(
      apiError(422, {
        message: 'Too many wrong passwords: the account is now locked. Reset your password or ask the Owner of your workspace to unlock it.',
        error_type: 'account_locked',
      }),
    );
    renderLogin();

    await submitCredentials('Wrong@2026');

    expect(await screen.findByText(/the account is now locked/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Reset your password' })).toHaveAttribute('href', '/forgot-password');
    expect(screen.getByLabelText('Password')).toHaveValue('');
  });
});
