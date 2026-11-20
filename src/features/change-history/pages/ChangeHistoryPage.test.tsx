import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { apiError, renderAt } from '@/test/renderWithProviders';
import showToaster from '@/utils/showToaster';
import type { ResourcePage } from '@/types/pagination';
import * as api from '../api/changeHistoryApi';
import type { ChangeHistoryEntry } from '../types';
import ChangeHistoryPage from './ChangeHistoryPage';

vi.mock('../api/changeHistoryApi');
vi.mock('@/utils/showToaster', () => ({ default: vi.fn() }));

const entry = (over: Partial<ChangeHistoryEntry> = {}): ChangeHistoryEntry => ({
  id: 1,
  at: '2026-11-20T09:12:00+02:00',
  action: 'update',
  user: 'Thandi Mokoena',
  recordId: '7',
  recordLabel: 'Karoo Coffee',
  page: 'Clients',
  pageKey: 'clients_clients',
  recordType: 'Client',
  changes: [
    { field: 'name', label: 'Name', old: 'Karoo Koffie', new: 'Karoo Coffee' },
    { field: 'is_active', label: 'Active', old: true, new: true },
  ],
  undo: { available: true, reason: null },
  undoneAt: null,
  undoneBy: null,
  undoOf: null,
  ...over,
});

const ADDED = entry({ id: 2, action: 'create', recordLabel: 'joburgeventhire.co.za', page: 'Sites', recordType: 'Site', changes: [{ field: 'url', label: 'URL', old: null, new: 'https://joburgeventhire.co.za' }], undo: { available: false, reason: 'To undo adding it, delete it on its page.' } });
const REMOVED = entry({ id: 3, action: 'delete', recordLabel: 'chair hire', page: 'Rank tracking', recordType: 'Keyword', changes: [{ field: 'tags', label: 'Tags', old: ['events', 'chairs'], new: null }] });

const page = (data: ChangeHistoryEntry[]): ResourcePage<ChangeHistoryEntry> => ({
  data,
  meta: { currentPage: 1, lastPage: 1, perPage: 15, total: data.length, from: 1, to: data.length },
});

const renderPage = (path = '/dashboard/settings/change-history') => renderAt(path, [{ path: '/dashboard/settings/change-history', element: <ChangeHistoryPage /> }]);
const table = () => screen.getAllByRole('table')[0];
const row = async (label: string) => {
  await waitFor(() => expect(within(table()).getAllByText(label).length).toBeGreaterThan(0));
  return within(table()).getAllByText(label)[0].closest('tr') as HTMLElement;
};

describe('ChangeHistoryPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.getChangeHistory).mockResolvedValue(page([entry(), ADDED, REMOVED]));
    vi.mocked(api.getChangeHistoryOptions).mockResolvedValue({ pages: [{ key: 'clients_clients', label: 'Clients' }], users: [{ id: 4, name: 'Thandi Mokoena' }] });
  });

  it('lists who changed what, with old and new values and the total', async () => {
    renderPage();
    const changed = await row('Karoo Coffee');
    expect(changed).toHaveTextContent('Thandi Mokoena');
    expect(changed).toHaveTextContent('Clients');
    expect(changed).toHaveTextContent('Changed');
    expect(changed).toHaveTextContent('Name: Karoo Koffie → Karoo Coffee');
    // A field whose shown value didn't change is left out.
    expect(changed).not.toHaveTextContent('Active');
    expect(await row('chair hire')).toHaveTextContent('events, chairs');
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('undoes a change after confirming, and says so', async () => {
    vi.mocked(api.undoChange).mockResolvedValue(entry({ undoneAt: '2026-11-20T10:00:00+02:00', undoneBy: 'Thandi Mokoena', undo: { available: false, reason: null } }));
    renderPage();
    await userEvent.click(within(await row('Karoo Coffee')).getByRole('button', { name: 'Undo this change to Karoo Coffee' }));

    const dialog = await screen.findByRole('alertdialog', { name: 'Undo this change?' });
    expect(dialog).toHaveTextContent('Karoo Coffee: Name back to “Karoo Koffie”.');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Undo' }));

    await waitFor(() => expect(api.undoChange).toHaveBeenCalledWith(1));
    expect(showToaster).toHaveBeenCalledWith('success', 'Change undone.');
  });

  it('brings a removed record back', async () => {
    vi.mocked(api.undoChange).mockResolvedValue(entry({ id: 3 }));
    renderPage();
    await userEvent.click(within(await row('chair hire')).getByRole('button', { name: 'Undo removing chair hire' }));
    await userEvent.click(within(await screen.findByRole('alertdialog', { name: 'Bring it back?' })).getByRole('button', { name: 'Undo' }));
    await waitFor(() => expect(showToaster).toHaveBeenCalledWith('success', 'chair hire is back.'));
  });

  it('greys out what cannot be undone, with the reason', async () => {
    renderPage();
    const button = within(await row('joburgeventhire.co.za')).getByRole('button', { name: /Undo this change to/ });
    expect(button).toBeDisabled();
    expect(button.parentElement).toHaveAttribute('title', 'To undo adding it, delete it on its page.');
  });

  it('shows the API’s reason when an undo is refused', async () => {
    vi.mocked(api.undoChange).mockRejectedValue(apiError(409, { message: 'Name has changed again since. Undo the later change first.', error_type: 'changed_since' }));
    renderPage();
    await userEvent.click(within(await row('Karoo Coffee')).getByRole('button', { name: 'Undo this change to Karoo Coffee' }));
    await userEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Undo' }));
    await waitFor(() => expect(showToaster).toHaveBeenCalledWith('error', 'Name has changed again since. Undo the later change first.'));
  });

  it('marks undone entries and undos, without an Undo button for them', async () => {
    vi.mocked(api.getChangeHistory).mockResolvedValue(
      page([entry({ undoneAt: '2026-11-20T10:00:00+02:00', undoneBy: 'Sipho Dlamini', undo: { available: false, reason: null } }), entry({ id: 9, recordLabel: 'Undo row', undoOf: 1 })]),
    );
    renderPage();
    const undone = await row('Karoo Coffee');
    expect(within(undone).getByText('Undone')).toBeInTheDocument();
    expect(within(undone).queryByRole('button', { name: /Undo/ })).not.toBeInTheDocument();
    expect(within(await row('Undo row')).getByText('Undo', { selector: 'span' })).toBeInTheDocument();
  });

  it('opens an entry in a drawer with every field, who and when, and undoes from there', async () => {
    vi.mocked(api.undoChange).mockResolvedValue(entry({ undoneAt: '2026-11-20T10:00:00+02:00', undoneBy: 'Thandi Mokoena', undo: { available: false, reason: null } }));
    renderPage();
    await userEvent.click(within(await row('Karoo Coffee')).getByText('Thandi Mokoena'));

    const drawer = await screen.findByRole('dialog', { name: 'Karoo Coffee' });
    expect(drawer).toHaveTextContent('Change history · Clients');
    expect(drawer).toHaveTextContent('Changed· Client');
    const fields = within(drawer).getByRole('table');
    expect(within(fields).getByRole('row', { name: /Name/ })).toHaveTextContent('NameKaroo KoffieKaroo Coffee');

    await userEvent.click(within(drawer).getByRole('button', { name: 'Undo this change' }));
    await userEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Undo' }));
    await waitFor(() => expect(within(screen.getByRole('dialog', { name: 'Karoo Coffee' })).getByText(/by Thandi Mokoena/)).toBeInTheDocument());
    expect(within(screen.getByRole('dialog', { name: 'Karoo Coffee' })).queryByRole('button', { name: 'Undo this change' })).not.toBeInTheDocument();

    const footer = screen.getByRole('dialog', { name: 'Karoo Coffee' }).querySelector('[data-slot="sheet-footer"]') as HTMLElement;
    await userEvent.click(within(footer).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('says in the drawer why an entry cannot be undone', async () => {
    renderPage();
    await userEvent.click(within(await row('joburgeventhire.co.za')).getByText('joburgeventhire.co.za'));
    const drawer = await screen.findByRole('dialog', { name: 'joburgeventhire.co.za' });
    expect(drawer).toHaveTextContent("Can't be undone here. To undo adding it, delete it on its page.");
    expect(within(drawer).getByRole('table')).toHaveTextContent('URLhttps://joburgeventhire.co.za');
  });

  it('shows stored dates as dd/mm/yyyy', async () => {
    vi.mocked(api.getChangeHistory).mockResolvedValue(page([entry({ changes: [{ field: 'period_start', label: 'From', old: null, new: '2026-10-01 00:00:00' }], action: 'create' })]));
    renderPage();
    expect(await row('Karoo Coffee')).toHaveTextContent('From: 01/10/2026');
  });

  it('filters by page, kind of change and search, in the URL', async () => {
    renderPage('/dashboard/settings/change-history?module=clients_clients&action=delete&search=karoo');
    await waitFor(() =>
      expect(api.getChangeHistory).toHaveBeenCalledWith(expect.objectContaining({ pageKey: 'clients_clients', action: 'delete', search: 'karoo', page: 1, perPage: 15 })),
    );
    expect(screen.getByRole('button', { name: /Clear filters/ })).toBeInTheDocument();
  });

  it('says when nothing matches', async () => {
    vi.mocked(api.getChangeHistory).mockResolvedValue(page([]));
    renderPage('/dashboard/settings/change-history?user=4');
    expect(await screen.findByText('No changes match these filters')).toBeInTheDocument();
  });
});
