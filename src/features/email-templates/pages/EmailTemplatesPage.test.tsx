import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmailTemplatesPage from './EmailTemplatesPage';
import * as api from '../api/emailTemplatesApi';
import { renderAt } from '@/test/renderWithProviders';
import showToaster from '@/utils/showToaster';
import type { EmailTemplate, EmailTemplatesPage as Page } from '../types';

vi.mock('../api/emailTemplatesApi');
vi.mock('@/utils/showToaster', () => ({ default: vi.fn() }));
// Quill needs a real browser: a textarea stands in for it.
vi.mock('@/components/form/RichTextEditor', () => ({
  RichTextEditor: ({ id, value, onChange, label }: { id: string; value: string; onChange: (v: string) => void; label: string }) => (
    <textarea id={id} aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}));

const invite: EmailTemplate = {
  type: 'user_invited',
  label: 'Added by an Owner',
  description: 'Sent when an Owner adds someone new, with a link to choose their password.',
  variables: [
    { key: 'name', description: "The person's first name" },
    { key: 'workspace', description: 'The workspace they were added to' },
  ],
  buttonText: 'Choose your password',
  subject: 'You have been given {{app_name}} access',
  body: '<p>Hi {{name}}, you can now use {{workspace}}.</p>',
  storesBody: false,
  directRecipient: 'The user',
  isCustomised: false,
  updatedAt: null,
};

const page: Page = {
  data: [invite, { ...invite, type: 'login_pin', label: 'Sign-in one-time PIN', isCustomised: true, updatedAt: '2026-11-19T09:00:00+02:00' }],
  mail: { fromName: 'Indlela', fromAddress: 'noreply@indlela.example' },
  can: { update: true },
};

const renderPage = () => renderAt('/settings/email-templates', [{ path: '/settings/email-templates', element: <EmailTemplatesPage /> }]);

describe('Email templates', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.getTemplates).mockResolvedValue(page);
    vi.mocked(api.previewTemplate).mockResolvedValue({ subject: 'You have been given Indlela access', body: '<p>Hi Nomsa, you can now use Acme Digital.</p>' });
  });

  it('lists every email with its wording state, and sends a test', async () => {
    vi.mocked(api.sendTest).mockResolvedValue({ message: 'Test email sent to owner@acme.example.' });
    renderPage();

    expect((await screen.findAllByText('Added by an Owner'))[0]).toBeInTheDocument();
    expect(screen.getAllByText('Customised')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Default')[0]).toBeInTheDocument();

    await userEvent.click(screen.getAllByRole('button', { name: `Send a test of ${invite.label}` })[0]);
    await waitFor(() => expect(showToaster).toHaveBeenCalledWith('success', 'Test email sent to owner@acme.example.'));
  });

  it('edits the wording with a live preview', async () => {
    vi.mocked(api.saveTemplate).mockResolvedValue(invite);
    renderPage();

    await userEvent.click((await screen.findAllByRole('button', { name: `Edit ${invite.label}` }))[0]);
    const drawer = await screen.findByRole('dialog', { name: invite.label });
    expect(await within(drawer).findByText('Hi Nomsa, you can now use Acme Digital.')).toBeInTheDocument();
    expect(within(drawer).getByRole('button', { name: '{{workspace}}' })).toBeInTheDocument();

    const subject = within(drawer).getByLabelText(/Subject/);
    await userEvent.clear(subject);
    await userEvent.click(within(drawer).getByRole('button', { name: 'Save' }));
    expect(await within(drawer).findByText('Enter a subject.')).toBeInTheDocument();

    // user-event reads `{{` as a literal `{`.
    await userEvent.type(subject, 'Welcome to {{{{workspace}}');
    await userEvent.click(within(drawer).getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(api.saveTemplate).toHaveBeenCalledWith('user_invited', {
        subject: 'Welcome to {{workspace}}',
        body: '<p>Hi {{name}}, you can now use {{workspace}}.</p>',
      }),
    );
    expect(showToaster).toHaveBeenCalledWith('success', `${invite.label} saved.`);
  });

  it('is read-only without update access', async () => {
    vi.mocked(api.getTemplates).mockResolvedValue({ ...page, can: { update: false } });
    renderPage();

    await userEvent.click((await screen.findAllByRole('button', { name: `Edit ${invite.label}` }))[0]);
    const drawer = await screen.findByRole('dialog', { name: invite.label });
    expect(within(drawer).queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
    // The footer's Close, besides the drawer's X.
    expect(within(drawer).getAllByRole('button', { name: 'Close' })).toHaveLength(2);
    expect(screen.queryByRole('button', { name: `Send a test of ${invite.label}` })).not.toBeInTheDocument();
  });
});
