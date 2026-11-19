import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegisterPage from './RegisterPage';
import * as authApi from '../api/authApi';
import { session } from '../session';
import { apiError, renderAt } from '@/test/renderWithProviders';
import type { SignedIn } from '../types';

vi.mock('../api/authApi');

/** Pastes into a field: same change events as typing, without a keystroke per character. */
async function fill(user: ReturnType<typeof userEvent.setup>, field: HTMLElement, value: string) {
  await user.click(field);
  await user.paste(value);
}

const routes = [
  { path: '/register', element: <RegisterPage /> },
  { path: '/dashboard', element: <p>Dashboard</p> },
];

async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  await fill(user, screen.getByLabelText('Your name'), 'Lindiwe Zulu');
  await fill(user, screen.getByLabelText('Email'), 'lindiwe@sandton.digital');
  await fill(user, screen.getByLabelText('Workspace name'), 'Sandton Digital');
  await fill(user, screen.getByLabelText('Password'), 'Start#2026');
  await fill(user, screen.getByLabelText('Confirm password'), 'Start#2026');
}

const signedIn: SignedIn = {
  requiresMfa: false,
  message: 'Login successful',
  token: '1|abc',
  tokenType: 'Bearer',
  user: {
    id: 7,
    name: 'Lindiwe Zulu',
    fullName: 'Lindiwe',
    surname: 'Zulu',
    email: 'lindiwe@sandton.digital',
    mobile: null,
    mfaChannel: 'email',
    role: 'Owner',
    previousLoginAt: null,
    seesAllClients: true,
    clients: [],
  },
  roles: ['Owner'],
  permissions: ['view_dashboard', 'view_settings_workspace'],
  workspace: { id: 3, name: 'Sandton Digital', slug: 'sandton-digital', logoUrl: null },
  workspaces: [{ id: 3, name: 'Sandton Digital', slug: 'sandton-digital', logoUrl: null, role: 'Owner' }],
};

describe('RegisterPage (create your workspace)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('checks the form before sending it', async () => {
    renderAt('/register', routes);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Password'), 'Short1!');
    await user.type(screen.getByLabelText('Confirm password'), 'Other1!');
    await user.click(screen.getByRole('button', { name: /create workspace/i }));

    expect(await screen.findByText('Name your workspace: your agency or business.')).toBeInTheDocument();
    expect(screen.getByText('Enter your name.')).toBeInTheDocument();
    expect(screen.getByText('The password does not meet the rules.')).toBeInTheDocument();
    expect(screen.getByText('The passwords do not match.')).toBeInTheDocument();
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it('signs in as the Owner straight away and opens the dashboard', async () => {
    vi.mocked(authApi.register).mockResolvedValue(signedIn);
    renderAt('/register', routes);
    const user = userEvent.setup();

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /create workspace/i }));

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/dashboard'));
    expect(authApi.register).toHaveBeenCalledWith(
      { name: 'Lindiwe Zulu', email: 'lindiwe@sandton.digital', workspaceName: 'Sandton Digital', password: 'Start#2026', passwordConfirmation: 'Start#2026' },
      expect.anything(),
    );
    expect(session.token()).toBe('1|abc');
    expect(session.workspace()?.name).toBe('Sandton Digital');
  });

  it('puts server validation errors on their fields', async () => {
    vi.mocked(authApi.register).mockRejectedValue(
      apiError(422, { message: 'Invalid', errors: { email: ['There is already an account for this email.'] } }),
    );
    renderAt('/register', routes);
    const user = userEvent.setup();

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /create workspace/i }));

    expect(await screen.findByText('There is already an account for this email.')).toBeInTheDocument();
    expect(session.token()).toBeNull();
  });
});
