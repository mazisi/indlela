import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResetPasswordPage from './ResetPasswordPage';
import * as authApi from '../api/authApi';
import { apiError, renderAt } from '@/test/renderWithProviders';

vi.mock('../api/authApi');

const routes = [{ path: '/reset-password', element: <ResetPasswordPage /> }];

describe('ResetPasswordPage', () => {
  beforeEach(() => vi.resetAllMocks());

  it('explains an incomplete link', () => {
    renderAt('/reset-password', routes);
    expect(screen.getByText('This link is incomplete')).toBeInTheDocument();
  });

  it('resets and returns to sign-in', async () => {
    vi.mocked(authApi.resetPassword).mockResolvedValue({ message: 'Your password was changed. Sign in with the new password.' });
    renderAt('/reset-password?token=t0k&email=nomsa%40example.co.za', routes);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('New password'), 'Fresh#2027');
    await user.type(screen.getByLabelText('Confirm new password'), 'Fresh#2027');
    await user.click(screen.getByRole('button', { name: /save new password/i }));

    await waitFor(() =>
      expect(authApi.resetPassword).toHaveBeenCalledWith(
        { token: 't0k', email: 'nomsa@example.co.za', password: 'Fresh#2027', passwordConfirmation: 'Fresh#2027' },
        expect.anything(),
      ),
    );
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/login'));
  });

  it('offers a new link when this one is dead', async () => {
    vi.mocked(authApi.resetPassword).mockRejectedValue(
      apiError(400, { message: 'The reset link is invalid or has expired. Ask for a new one.', error_type: 'invalid_reset_token' }),
    );
    renderAt('/reset-password?token=old&email=nomsa%40example.co.za', routes);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('New password'), 'Fresh#2027');
    await user.type(screen.getByLabelText('Confirm new password'), 'Fresh#2027');
    await user.click(screen.getByRole('button', { name: /save new password/i }));

    expect(await screen.findByText('The reset link is invalid or has expired. Ask for a new one.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Send me a new link' })).toBeInTheDocument();
  });
});
