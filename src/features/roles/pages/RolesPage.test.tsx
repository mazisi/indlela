import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RolesPage from './RolesPage';
import * as api from '../api/rolesApi';
import { apiError, renderAt } from '@/test/renderWithProviders';
import showToaster from '@/utils/showToaster';
import type { CatalogGroup, Role, RolesResponse } from '../types';

vi.mock('../api/rolesApi');
vi.mock('@/utils/showToaster', () => ({ default: vi.fn() }));

const permissions = vi.hoisted(() => ({ list: [] as string[] }));
vi.mock('@/contexts/PermissionContextType', () => ({
  usePermissions: () => ({ hasPermission: (p: string) => permissions.list.includes(p) }),
}));

const GROUPS: CatalogGroup[] = [
  {
    key: 'reports',
    label: 'Reports',
    resources: [
      { key: 'reports_overview', label: 'Reports overview', actions: ['view'], grantable: true },
      { key: 'reports', label: 'Client reports', actions: ['view', 'create', 'update', 'delete', 'approve'], grantable: true },
    ],
  },
  {
    key: 'settings',
    label: 'Settings',
    resources: [
      { key: 'settings_email_templates', label: 'Email templates', actions: ['view', 'update'], grantable: true },
      { key: 'settings_users', label: 'Users and access', actions: ['view', 'create', 'update', 'delete'], grantable: false },
    ],
  },
];

const role = (over: Partial<Role>): Role => ({
  id: 2,
  name: 'Analyst',
  description: 'Runs audits and writes the reports',
  isSystem: false,
  allClients: false,
  usersCount: 3,
  permissions: ['view_reports', 'create_reports'],
  ...over,
});

const OWNER = role({
  id: 1,
  name: 'Owner',
  description: null,
  isSystem: true,
  allClients: true,
  usersCount: 1,
  permissions: GROUPS.flatMap((g) => g.resources.flatMap((r) => r.actions.map((a) => `${a}_${r.key}`))),
});

const response = (roles: Role[] = [OWNER, role({}), role({ id: 3, name: 'Clerk', usersCount: 0, permissions: [] })]): RolesResponse => ({
  roles,
  groups: GROUPS,
});

const renderPage = async (path = '/dashboard/settings/roles') => {
  renderAt(path, [{ path: '/dashboard/settings/roles', element: <RolesPage /> }]);
  await screen.findByRole('combobox', { name: 'Role' });
};

const box = (name: string) => screen.getByRole('checkbox', { name });
const openGroup = (label: string) => userEvent.click(screen.getByRole('button', { name: new RegExp(`^${label}`) }));

describe('RolesPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    permissions.list = ['view_settings_roles', 'create_settings_roles', 'update_settings_roles', 'delete_settings_roles'];
    vi.mocked(api.getRoles).mockResolvedValue(response());
    vi.mocked(api.getRoleHistory).mockResolvedValue({
      data: [],
      meta: { currentPage: 1, lastPage: 1, perPage: 15, total: 4, from: null, to: null },
    });
  });

  it('groups pages like the sidebar, collapsed, with counts', async () => {
    await renderPage();

    expect(screen.getByRole('combobox', { name: 'Role' })).toHaveTextContent('Analyst');
    const reports = screen.getByRole('button', { name: /^Reports/ });
    expect(reports).toHaveAttribute('aria-expanded', 'false');
    expect(reports).toHaveTextContent('(2/6)');
    expect(screen.queryByRole('checkbox', { name: 'View Client reports' })).not.toBeInTheDocument();

    await openGroup('Reports');
    expect(box('View Client reports')).toBeChecked();
    expect(box('Create Client reports')).toBeChecked();
    expect(box('Approve Client reports')).not.toBeChecked();
    // Overview pages are view only.
    expect(screen.queryByRole('checkbox', { name: 'Create Reports overview' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /History/ })).toHaveTextContent('4');
  });

  it('keeps View with every action and saves the pages the role can be given', async () => {
    vi.mocked(api.updateRolePermissions).mockResolvedValue(role({}));
    await renderPage();
    await openGroup('Reports');

    await userEvent.click(box('Approve Client reports'));
    await userEvent.click(box('View Reports overview'));
    expect(screen.getByText('Unsaved changes to Analyst')).toBeInTheDocument();

    await userEvent.click(box('View Client reports'));
    expect(box('Create Client reports')).not.toBeChecked();
    await userEvent.click(box('Update Client reports'));
    expect(box('View Client reports')).toBeChecked();

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(api.updateRolePermissions).toHaveBeenCalledWith(2, expect.arrayContaining(['view_reports_overview', 'view_reports', 'update_reports'])),
    );
    expect(vi.mocked(api.updateRolePermissions).mock.calls[0][1]).toHaveLength(3);
  });

  it('select all works per group and per action, but never on Owner-only pages', async () => {
    await renderPage();
    await openGroup('Settings');

    await userEvent.click(box('Select all: Settings'));
    expect(box('Update Email templates')).toBeChecked();
    expect(box('View Users and access')).not.toBeChecked();
    expect(box('View Users and access')).toBeDisabled();

    await openGroup('Reports');
    await userEvent.click(box('Approve: every Reports page'));
    expect(box('Approve Client reports')).toBeChecked();
    expect(box('View Client reports')).toBeChecked();

    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(box('Approve Client reports')).not.toBeChecked();
    expect(screen.queryByText(/Unsaved changes/)).not.toBeInTheDocument();
  });

  it('expands and collapses every group', async () => {
    await renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Expand all' }));
    expect(screen.getByRole('button', { name: /^Reports/ })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: /^Settings/ })).toHaveAttribute('aria-expanded', 'true');

    await userEvent.click(screen.getByRole('button', { name: 'Collapse all' }));
    expect(screen.getByRole('button', { name: /^Reports/ })).toHaveAttribute('aria-expanded', 'false');
  });

  it('asks before switching roles with unsaved changes', async () => {
    await renderPage();
    await openGroup('Reports');
    await userEvent.click(box('Approve Client reports'));

    await userEvent.click(screen.getByRole('combobox', { name: 'Role' }));
    await userEvent.click(await screen.findByRole('option', { name: /Clerk/ }));

    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveTextContent('Discard changes to Analyst?');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Discard' }));
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('role=3'));
    expect(box('View Client reports')).not.toBeChecked();
  });

  it('keeps the Owner role read-only: full access, no rename, no delete', async () => {
    await renderPage('/dashboard/settings/roles?role=1');
    await openGroup('Settings');

    expect(screen.getByText(/Owners always have full access to the workspace/)).toBeInTheDocument();
    expect(box('Delete Users and access')).toBeChecked();
    expect(box('Delete Users and access')).toBeDisabled();
    expect(box('Update Email templates')).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Edit role' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
  });

  it('adds a role in a drawer and switches to it', async () => {
    const clerk = role({ id: 9, name: 'Content Writer', usersCount: 0, permissions: [] });
    vi.mocked(api.createRole).mockResolvedValue(clerk);
    await renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Add role' }));
    const drawer = await screen.findByRole('dialog');
    await userEvent.type(within(drawer).getByLabelText('Role name'), 'Content Writer');
    vi.mocked(api.getRoles).mockResolvedValue(response([OWNER, role({}), clerk]));
    await userEvent.click(within(drawer).getByRole('button', { name: 'Add role' }));

    await waitFor(() => expect(api.createRole).toHaveBeenCalledWith({ name: 'Content Writer', description: '', allClients: false }));
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('role=9'));
  });

  it('shows the server reason when a role cannot be deleted', async () => {
    vi.mocked(api.deleteRole).mockRejectedValue(apiError(409, { message: 'Clerk still has 1 user. Give them another role first.' }));
    await renderPage('/dashboard/settings/roles?role=3');

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await userEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(showToaster).toHaveBeenCalledWith('error', 'Clerk still has 1 user. Give them another role first.'));
  });

  it('is read-only without update rights', async () => {
    permissions.list = ['view_settings_roles'];
    await renderPage();
    await openGroup('Reports');

    expect(box('Create Client reports')).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Add role' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit role' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
  });
});
