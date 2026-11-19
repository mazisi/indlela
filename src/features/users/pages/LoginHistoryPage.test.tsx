import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginHistoryPage from './LoginHistoryPage';
import * as api from '../api/loginHistoryApi';
import { renderAt } from '@/test/renderWithProviders';
import type { LoginEvent, ResourcePage } from '../types';

vi.mock('../api/loginHistoryApi');

const event = (over: Partial<LoginEvent>): LoginEvent => ({
  id: 1,
  at: '2026-09-23T07:12:00+02:00',
  email: 'kevin@example.co.za',
  user: 'Kevin Adams',
  event: 'account_locked',
  eventLabel: 'Account locked',
  note: '5 wrong passwords',
  ipAddress: '127.0.0.1',
  ...over,
});

const page = (data: LoginEvent[], total = data.length): ResourcePage<LoginEvent> => ({
  data,
  meta: { currentPage: 1, lastPage: Math.ceil(total / 15) || 1, perPage: 15, total, from: 1, to: data.length },
});

const renderPage = (path = '/dashboard/settings/login-history') =>
  renderAt(path, [{ path: '/dashboard/settings/login-history', element: <LoginHistoryPage /> }]);

describe('LoginHistoryPage', () => {
  beforeEach(() => vi.resetAllMocks());

  it('lists events and marks the ones that need attention', async () => {
    vi.mocked(api.getLoginHistory).mockResolvedValue(
      page([event({}), event({ id: 2, user: 'Johan Benecke', email: 'johan@example.co.za', event: 'signed_in', eventLabel: 'Signed in', note: '2FA by email' })], 2),
    );
    renderPage();

    const locked = await screen.findAllByText('Account locked');
    expect(locked[0]).toHaveClass('text-bad');
    expect(screen.getAllByText('Signed in')[0]).not.toHaveClass('text-bad');
    expect(screen.getAllByText('23/09/2026 07:12')[0]).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // total entries
  });

  it('searches after typing pauses and puts filters in the URL', async () => {
    vi.mocked(api.getLoginHistory).mockResolvedValue(page([event({})]));
    renderPage();
    await screen.findAllByText('Kevin Adams');

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search name or email' }), 'kevin');

    await waitFor(() =>
      expect(api.getLoginHistory).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'kevin', page: 1, perPage: 15 })),
    );
    expect(screen.getByTestId('location')).toHaveTextContent('search=kevin');
  });

  it('reads filters from the URL', async () => {
    vi.mocked(api.getLoginHistory).mockResolvedValue(page([]));
    renderPage('/dashboard/settings/login-history?event=wrong_password&page=2');

    expect(await screen.findByText('Nothing matches these filters')).toBeInTheDocument();
    expect(api.getLoginHistory).toHaveBeenCalledWith(expect.objectContaining({ event: 'wrong_password', page: 2 }));
  });
});
