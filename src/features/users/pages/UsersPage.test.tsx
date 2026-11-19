import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UsersPage from './UsersPage';
import * as usersApi from '../api/usersApi';
import { apiError, renderAt } from '@/test/renderWithProviders';
import showToaster from '@/utils/showToaster';
import type { AppUser, UsersPage as UsersResponse } from '../types';

vi.mock('../api/usersApi');
vi.mock('@/utils/showToaster', () => ({ default: vi.fn() }));

const ALL = ['view', 'create', 'update', 'delete'].map((a) => `${a}_settings_users`);
const permissions = vi.hoisted(() => ({ list: [] as string[] }));
vi.mock('@/contexts/PermissionContextType', () => ({
  usePermissions: () => ({ hasPermission: (p: string) => permissions.list.includes(p) }),
}));

const user = (over: Partial<AppUser>): AppUser => ({
  id: 2,
  fullName: 'Kevin',
  surname: 'Adams',
  name: 'Kevin Adams',
  email: 'kevin@example.co.za',
  mobile: '0825550103',
  role: { id: 6, name: 'Analyst', isSystem: false, allClients: false },
  clients: [{ id: 2, name: 'Durban Dental' }],
  mfaChannel: 'sms',
  status: 'active',
  statusLabel: 'Active',
  lockedAt: null,
  lastLoginAt: '2026-10-01T08:15:00+02:00',
  isYou: false,
  ...over,
});

const ME = user({ id: 1, fullName: 'Johan', surname: 'Pretorius', name: 'Johan Pretorius', email: 'johan@example.co.za', role: { id: 1, name: 'Owner', isSystem: true, allClients: true }, clients: [], isYou: true });
const KEVIN = user({ status: 'locked', statusLabel: 'Locked' });
const NOMSA = user({ id: 3, fullName: 'Nomsa', surname: 'Dube', name: 'Nomsa Dube', email: 'nomsa@example.co.za', mfaChannel: 'off' });

const list = (data: AppUser[]): UsersResponse => ({
  data,
  meta: { currentPage: 1, lastPage: 1, perPage: 15, total: data.length, from: 1, to: data.length },
  summary: { all: 8, active: 6, locked: 1, disabled: 1 },
});

const OPTIONS = {
  roles: [
    { id: 1, name: 'Owner', description: 'Full access', isSystem: true, allClients: true },
    { id: 5, name: 'Manager', description: 'Runs every client', isSystem: false, allClients: true },
    { id: 4, name: 'Client', description: 'Read-only for their own business', isSystem: false, allClients: false },
  ],
  clients: [
    { id: 1, name: 'Karoo Coffee' },
    { id: 2, name: 'Durban Dental' },
  ],
};

const renderPage = async (path = '/dashboard/settings/users') => {
  renderAt(path, [{ path: '/dashboard/settings/users', element: <UsersPage /> }]);
  await screen.findAllByText('Kevin Adams');
};

describe('UsersPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    permissions.list = ALL;
    vi.mocked(usersApi.getUsers).mockResolvedValue(list([ME, KEVIN, NOMSA]));
    vi.mocked(usersApi.getUserOptions).mockResolvedValue(OPTIONS);
    vi.mocked(usersApi.getUserHistory).mockResolvedValue({ data: [], meta: { currentPage: 1, lastPage: 1, perPage: 15, total: 5, from: null, to: null } });
  });

  it('lists users with role, PIN, status and counts per status', async () => {
    await renderPage();

    expect(screen.getAllByText('Locked')[0]).toBeInTheDocument();
    expect(screen.getAllByText('You')[0]).toBeInTheDocument();
    expect(screen.getAllByText('All clients')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Off')[0]).toHaveClass('text-bad');
    expect(screen.getByRole('button', { name: 'Locked (1)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /History/ })).toHaveTextContent('5');
  });

  it('filters by status and search through the URL', async () => {
    await renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Locked (1)' }));
    await waitFor(() => expect(usersApi.getUsers).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'locked', page: 1 })));

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search name, email or role' }), 'kev');
    await waitFor(() => expect(usersApi.getUsers).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'kev', status: 'locked' })));
    expect(screen.getByTestId('location')).toHaveTextContent('status=locked');
  });

  it('adds a user in a drawer and shows server errors on the field', async () => {
    vi.mocked(usersApi.createUser).mockRejectedValueOnce(apiError(422, { errors: { email: ['Another user already has this email address.'] } }));
    await renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Add user' }));
    const drawer = await screen.findByRole('dialog');
    await userEvent.type(within(drawer).getByLabelText('First name'), 'Thandi');
    await userEvent.type(within(drawer).getByLabelText('Surname'), 'Mokoena');
    await userEvent.type(within(drawer).getByLabelText('Email'), 'kevin@example.co.za');
    await userEvent.type(within(drawer).getByLabelText('Cell number'), '0825550199');
    await userEvent.click(within(drawer).getByRole('combobox', { name: 'Role' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Client' }));
    await userEvent.click(within(drawer).getByRole('checkbox', { name: 'Karoo Coffee' }));
    expect(within(drawer).queryByText('Status')).not.toBeInTheDocument();
    await userEvent.click(within(drawer).getByRole('button', { name: 'Add user' }));

    expect(await within(drawer).findByText('Another user already has this email address.')).toBeInTheDocument();
    expect(usersApi.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ fullName: 'Thandi', mobile: '0825550199', roleId: 4, clientIds: [1], mfaChannel: 'email', status: undefined }),
    );
  });

  it('needs client access for roles that do not see every client', async () => {
    vi.mocked(usersApi.createUser).mockResolvedValue(NOMSA);
    await renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Add user' }));
    const drawer = await screen.findByRole('dialog');
    await userEvent.type(within(drawer).getByLabelText('First name'), 'Sipho');
    await userEvent.type(within(drawer).getByLabelText('Surname'), 'Nkosi');
    await userEvent.type(within(drawer).getByLabelText('Email'), 'sipho@example.co.za');
    await userEvent.click(within(drawer).getByRole('combobox', { name: 'Role' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Client' }));
    await userEvent.click(within(drawer).getByRole('button', { name: 'Add user' }));
    expect(await within(drawer).findByText('Give access to at least one client.')).toBeInTheDocument();
    expect(usersApi.createUser).not.toHaveBeenCalled();

    await userEvent.click(within(drawer).getByRole('combobox', { name: 'Role' }));
    await userEvent.click(await screen.findByRole('option', { name: /Manager/ }));
    expect(within(drawer).getByText('This role sees every client of the workspace, including ones added later.')).toBeInTheDocument();
    expect(within(drawer).queryByRole('checkbox', { name: 'Karoo Coffee' })).not.toBeInTheDocument();
    await userEvent.click(within(drawer).getByRole('button', { name: 'Add user' }));

    await waitFor(() => expect(usersApi.createUser).toHaveBeenCalledWith(expect.objectContaining({ roleId: 5, clientIds: [], mobile: '' })));
  });

  it('asks for a cell number only when the PIN goes by SMS', async () => {
    await renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Add user' }));
    const drawer = await screen.findByRole('dialog');
    await userEvent.click(within(drawer).getByRole('combobox', { name: 'One-time PIN by' }));
    await userEvent.click(await screen.findByRole('option', { name: 'SMS' }));
    await userEvent.click(within(drawer).getByRole('button', { name: 'Add user' }));
    expect(await within(drawer).findByText('Add a cell number to send the PIN by SMS.')).toBeInTheDocument();
  });

  it('shows the API reason when an account in another workspace cannot be changed', async () => {
    vi.mocked(usersApi.updateUser).mockRejectedValue(apiError(403, { message: 'Nomsa also uses another workspace, so only she can change her account details.' }));
    vi.mocked(usersApi.getUsers).mockResolvedValue(list([ME, KEVIN, { ...NOMSA, sharedAccount: true }]));
    await renderPage();

    await userEvent.click(screen.getAllByRole('button', { name: 'Edit Nomsa Dube' })[0]);
    const drawer = await screen.findByRole('dialog');
    expect(within(drawer).getByLabelText('Email')).toHaveAttribute('readonly');
    await userEvent.click(within(drawer).getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(showToaster).toHaveBeenCalledWith('error', 'Nomsa also uses another workspace, so only she can change her account details.'));
  });

  it('edits a user, including their status', async () => {
    vi.mocked(usersApi.updateUser).mockResolvedValue(NOMSA);
    await renderPage();

    await userEvent.click(screen.getAllByRole('button', { name: 'Edit Nomsa Dube' })[0]);
    const drawer = await screen.findByRole('dialog');
    expect(within(drawer).getByLabelText('First name')).toHaveValue('Nomsa');
    await userEvent.click(within(drawer).getByRole('radio', { name: /Disabled/ }));
    await userEvent.click(within(drawer).getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(usersApi.updateUser).toHaveBeenCalledWith(3, expect.objectContaining({ status: 'disabled', roleId: 6 })));
  });

  it('never lets you select or delete yourself, and asks before disabling', async () => {
    vi.mocked(usersApi.bulkUpdateUsers).mockResolvedValue({ affected: 2 });
    await renderPage();

    expect(screen.queryByRole('checkbox', { name: 'Select Johan Pretorius' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete Johan Pretorius' })).not.toBeInTheDocument();

    await userEvent.click(screen.getAllByRole('checkbox', { name: 'Select all users on this page' })[0]);
    const bar = screen.getByRole('region', { name: 'Bulk actions' });
    expect(bar).toHaveTextContent('2 selected');
    await userEvent.click(within(bar).getByRole('button', { name: 'Disable' }));

    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveTextContent('Disable 2 users?');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Disable' }));
    await waitFor(() => expect(usersApi.bulkUpdateUsers).toHaveBeenCalledWith('disable', [2, 3]));
  });

  it('unlocks straight away, and confirms before emailing a reset link', async () => {
    vi.mocked(usersApi.unlockUser).mockResolvedValue();
    vi.mocked(usersApi.sendPasswordReset).mockResolvedValue();
    await renderPage();

    expect(screen.queryByRole('button', { name: 'Unlock Nomsa Dube' })).not.toBeInTheDocument();
    await userEvent.click(screen.getAllByRole('button', { name: 'Unlock Kevin Adams' })[0]);
    await waitFor(() => expect(usersApi.unlockUser).toHaveBeenCalledWith(2));
    expect(showToaster).toHaveBeenCalledWith('success', 'Kevin Adams is unlocked.');

    await userEvent.click(screen.getAllByRole('button', { name: 'Reset password for Kevin Adams' })[0]);
    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveTextContent('kevin@example.co.za');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Send link' }));
    await waitFor(() => expect(usersApi.sendPasswordReset).toHaveBeenCalledWith(2));
  });

  it('shows the reason when a delete is refused', async () => {
    vi.mocked(usersApi.deleteUser).mockRejectedValue(apiError(422, { message: 'You cannot delete the only active Owner.' }));
    await renderPage();

    await userEvent.click(screen.getAllByRole('button', { name: 'Delete Kevin Adams' })[0]);
    await userEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(showToaster).toHaveBeenCalledWith('error', 'You cannot delete the only active Owner.'));
  });

  it('is read-only with view access only', async () => {
    permissions.list = ['view_settings_users'];
    await renderPage();

    expect(screen.queryByRole('button', { name: 'Add user' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Edit / })).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });
});
