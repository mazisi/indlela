import { describe, expect, it } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import toast from 'react-hot-toast';
import { AppToaster } from './AppToaster';

describe('AppToaster', () => {
  // jsdom has no matchMedia; react-hot-toast asks it about reduced motion.
  window.matchMedia ??= ((query: string) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;

  it('closes a toast with its Dismiss button', async () => {
    render(<AppToaster />);
    act(() => {
      toast.error('Fill in before sending: the client name.', { removeDelay: 0 });
    });

    expect(await screen.findByText('Fill in before sending: the client name.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    await waitFor(() => expect(screen.queryByText('Fill in before sending: the client name.')).not.toBeInTheDocument(), { timeout: 5000 });
  });
});
