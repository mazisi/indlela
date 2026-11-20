import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useLocation } from 'react-router';
import { Sidebar } from './Sidebar';
import { MODULES, permissionFor } from '@/config/modules';
import { PermissionContext } from '@/contexts/PermissionContextType';
import { TooltipProvider } from '@/components/ui/tooltip';
import * as authApi from '@/features/auth/api/authApi';
import { session } from '@/features/auth/session';
import type { AccountState, AuthUser, WorkspaceMembership } from '@/features/auth/types';
import { version } from '../../../package.json';

vi.mock('@/features/auth/api/authApi');

const user: AuthUser = {
  id: 1,
  name: 'Hendrik Smit',
  fullName: 'Hendrik',
  surname: 'Smit',
  email: 'hendrik@example.co.za',
  mobile: null,
  mfaChannel: 'email',
  role: 'Manager',
  previousLoginAt: null,
  seesAllClients: true,
  clients: [
    { id: 1, name: 'Karoo Coffee' },
    { id: 2, name: 'Durban Dental' },
  ],
};

const ACME: WorkspaceMembership = { id: 1, name: 'Acme Digital', slug: 'acme-digital', logoUrl: null, role: 'Manager' };
const BOSVELD: WorkspaceMembership = { id: 2, name: 'Bosveld Foods', slug: 'bosveld-foods', logoUrl: null, role: 'Client' };

function Where() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderSidebar(permissions: string[], path = '/dashboard', overrides: Partial<AuthUser> = {}, workspaces: WorkspaceMembership[] = [ACME, BOSVELD]) {
  const ctx = {
    permissions,
    roles: [],
    loading: false,
    hasPermission: (p: string) => permissions.includes(p),
    hasRole: () => false,
    hasAnyPermission: (ps: string[]) => ps.some((p) => permissions.includes(p)),
    levelFor: () => 'none' as const,
    actionsOn: () => [],
    refreshPermissions: () => {},
    user: { ...user, ...overrides },
    workspace: workspaces[0],
    workspaces,
    isOwner: false,
  };
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const view = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <PermissionContext.Provider value={ctx}>
          <TooltipProvider>
            <Sidebar isOpen={false} toggleSidebar={() => {}} isCollapsed={false} onToggleCollapse={() => {}} />
          </TooltipProvider>
        </PermissionContext.Provider>
        <Where />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...view, queryClient };
}

const nav = () => within(screen.getByRole('navigation'));

describe('Sidebar', () => {
  it('shows only the pages a role can open', async () => {
    renderSidebar(['view_dashboard', 'view_clients_sites', 'view_settings_email_templates', 'view_settings_workspace', 'view_search_console']);

    expect(nav().getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    expect(nav().getByRole('link', { name: 'Search Console' })).toHaveAttribute('href', '/dashboard/search-console');
    expect(nav().queryByRole('link', { name: 'Site audit' })).not.toBeInTheDocument();
    expect(nav().queryByRole('link', { name: 'Rank tracking' })).not.toBeInTheDocument();

    await userEvent.click(nav().getByRole('button', { name: 'Settings' }));
    expect(nav().getByRole('link', { name: 'Email templates' })).toBeInTheDocument();
    expect(nav().getByRole('link', { name: 'Workspace' })).toBeInTheDocument();
    expect(nav().queryByRole('link', { name: 'Login history' })).not.toBeInTheDocument();
    expect(nav().queryByRole('link', { name: 'Users and access' })).not.toBeInTheDocument();

    await userEvent.click(nav().getByRole('button', { name: 'Clients' }));
    expect(nav().getByRole('link', { name: 'Sites' })).toHaveAttribute('href', '/dashboard/clients/sites');
    expect(nav().queryByRole('link', { name: 'Clients' })).not.toBeInTheDocument();
  });

  it('mirrors the API permission catalogue: {action}_{resource}', () => {
    const resources = MODULES.flatMap((m) => (m.items ? m.items.map((i) => permissionFor(m, i)) : [permissionFor(m)]));
    expect(resources).toEqual([
      'view_dashboard',
      'view_clients_clients',
      'view_clients_sites',
      'view_search_console',
      'view_site_audit',
      'view_rank_tracking',
      'view_reports',
      'view_settings_users',
      'view_settings_roles',
      'view_settings_login_history',
      'view_settings_email_templates',
      'view_settings_workspace',
      'view_platform_usage',
    ]);
  });

  it('hides the Platform group from anyone without view_platform_usage', () => {
    renderSidebar(['view_dashboard', 'view_rank_tracking', 'view_settings_workspace']);

    expect(nav().queryByRole('button', { name: 'Platform' })).not.toBeInTheDocument();
    expect(nav().queryByRole('link', { name: 'Usage' })).not.toBeInTheDocument();
    expect(nav().queryByText('Platform')).not.toBeInTheDocument();
  });

  it('shows Platform › Usage, last, to Indlela staff', async () => {
    renderSidebar(['view_dashboard', 'view_settings_workspace', 'view_platform_usage']);

    const groups = nav().getAllByRole('button', { name: /^(Settings|Platform)$/ });
    expect(groups.map((b) => b.textContent)).toEqual(['Settings', 'Platform']);
    await userEvent.click(nav().getByRole('button', { name: 'Platform' }));
    expect(nav().getByRole('link', { name: 'Usage' })).toHaveAttribute('href', '/dashboard/platform/usage');
  });

  it('shows which version of the app is running', () => {
    renderSidebar(['view_dashboard']);

    expect(screen.getByText(`Version ${version}`)).toBeInTheDocument();
  });

  it('says a one-time PIN is needed to sign in again only when the user has one', async () => {
    const { unmount } = renderSidebar(['view_dashboard']);
    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(await screen.findByText("You'll need your password and a one-time PIN to sign in again.")).toBeInTheDocument();
    unmount();

    renderSidebar(['view_dashboard'], '/dashboard', { mfaChannel: 'off' });
    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(await screen.findByText("You'll need your password to sign in again.")).toBeInTheDocument();
  });

  it('hides a whole module without access', () => {
    renderSidebar(['view_dashboard', 'view_clients_clients']);

    expect(nav().getByRole('button', { name: 'Clients' })).toBeInTheDocument();
    expect(nav().queryByRole('button', { name: 'Settings' })).not.toBeInTheDocument();
    expect(nav().queryByRole('link', { name: 'Reports' })).not.toBeInTheDocument();
  });

  it('opens the section holding the current page', () => {
    renderSidebar(['view_clients_sites'], '/dashboard/clients/sites');

    expect(nav().getByRole('button', { name: 'Clients' })).toHaveAttribute('aria-expanded', 'true');
    expect(nav().getByRole('link', { name: 'Sites' })).toHaveAttribute('aria-current', 'page');
  });

  it('keeps one section open at a time', async () => {
    renderSidebar(['view_clients_sites', 'view_settings_users'], '/dashboard/clients/sites');
    const section = (name: string) => nav().getByRole('button', { name });

    // Opening another section closes the one with the current page.
    await userEvent.click(section('Settings'));
    expect(section('Settings')).toHaveAttribute('aria-expanded', 'true');
    expect(section('Clients')).toHaveAttribute('aria-expanded', 'false');
    // Closing it leaves them all closed.
    await userEvent.click(section('Settings'));
    expect(['Clients', 'Settings'].map((n) => section(n).getAttribute('aria-expanded'))).toEqual(['false', 'false']);

    // Opening a page shows only its own section.
    await userEvent.click(section('Settings'));
    await userEvent.click(nav().getByRole('link', { name: 'Users and access' }));
    expect(section('Settings')).toHaveAttribute('aria-expanded', 'true');
    expect(section('Clients')).toHaveAttribute('aria-expanded', 'false');
  });

  it('scrolls a section into view when it is opened', async () => {
    const scrollIntoView = vi.spyOn(HTMLElement.prototype, 'scrollIntoView');
    renderSidebar(['view_clients_sites', 'view_settings_users'], '/dashboard/clients/sites');

    // Open with the current page: no smooth section scroll.
    expect(scrollIntoView).not.toHaveBeenCalledWith({ block: 'nearest', behavior: 'smooth' });
    await userEvent.click(nav().getByRole('button', { name: 'Settings' }));
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', behavior: 'smooth' });
    scrollIntoView.mockRestore();
  });

  it('brings the current page into view, just far enough, once the menu is there', () => {
    const scrollIntoView = vi.spyOn(HTMLElement.prototype, 'scrollIntoView');
    renderSidebar(['view_clients_sites', 'view_settings_users'], '/dashboard/clients/sites');

    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' });
    expect(scrollIntoView.mock.instances[0]).toBe(nav().getByRole('link', { name: 'Sites' }));
    scrollIntoView.mockRestore();
  });

  it('leaves the menu alone while searching', async () => {
    renderSidebar(['view_clients_sites', 'view_settings_users'], '/dashboard/clients/sites');
    const scrollIntoView = vi.spyOn(HTMLElement.prototype, 'scrollIntoView');

    await userEvent.type(screen.getByRole('searchbox'), 'roles');

    expect(scrollIntoView).not.toHaveBeenCalled();
    scrollIntoView.mockRestore();
  });

  it('searches the menu by section and page name', async () => {
    renderSidebar(['view_clients_clients', 'view_clients_sites', 'view_settings_users', 'view_settings_roles']);
    const search = screen.getByRole('searchbox', { name: 'Search the menu' });

    await userEvent.type(search, 'roles');
    const roles = nav().getByRole('link', { name: 'Roles and permissions' });
    expect(roles.querySelector('mark')).toHaveTextContent('Roles');
    expect(nav().queryByRole('link', { name: 'Users and access' })).not.toBeInTheDocument();
    expect(nav().queryByRole('button', { name: 'Clients' })).not.toBeInTheDocument();

    // A section's name keeps all its pages.
    await userEvent.clear(search);
    await userEvent.type(search, 'clients');
    expect(nav().getByRole('link', { name: 'Clients' })).toBeInTheDocument();
    expect(nav().getByRole('link', { name: 'Sites' })).toBeInTheDocument();

    await userEvent.clear(search);
    await userEvent.type(search, 'backlinks');
    expect(nav().getByRole('status')).toHaveTextContent('No pages match “backlinks”.');

    await userEvent.keyboard('{Escape}');
    expect(search).toHaveValue('');
    expect(nav().getByRole('button', { name: 'Settings' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens the first match on Enter and clears the search', async () => {
    renderSidebar(['view_settings_users', 'view_settings_roles']);
    const search = screen.getByRole('searchbox', { name: 'Search the menu' });

    await userEvent.type(search, 'roles{Enter}');
    expect(search).toHaveValue('');
    expect(nav().getByRole('link', { name: 'Roles and permissions' })).toHaveAttribute('aria-current', 'page');
  });

  it('switches workspace: new permissions, a cleared cache, back to the dashboard', async () => {
    const next: AccountState = {
      user: { ...user, role: 'Client', seesAllClients: false, clients: [] },
      roles: ['Client'],
      permissions: ['view_dashboard'],
      workspace: BOSVELD,
      workspaces: [ACME, BOSVELD],
    };
    vi.mocked(authApi.switchWorkspace).mockResolvedValue(next);
    const { queryClient } = renderSidebar(['view_clients_sites'], '/dashboard/clients/sites');
    queryClient.setQueryData(['sites', 'list'], { data: [] });

    const picker = screen.getByRole('combobox', { name: 'Workspace' });
    expect(picker).toHaveTextContent('Acme Digital');
    await userEvent.click(picker);
    expect(screen.getByRole('option', { name: /Bosveld Foods.*Client/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('option', { name: /Bosveld Foods/ }));

    await waitFor(() => expect(authApi.switchWorkspace).toHaveBeenCalledWith(2, expect.anything()));
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(/^\/dashboard$/));
    expect(session.workspace()?.name).toBe('Bosveld Foods');
    expect(session.permissions()).toEqual(['view_dashboard']);
    expect(queryClient.getQueryData(['sites', 'list'])).toBeUndefined();
    expect(queryClient.getQueryData(['me'])).toEqual(next);
  });

  it('has nothing to switch to with one workspace', () => {
    renderSidebar(['view_dashboard'], '/dashboard', {}, [ACME]);

    expect(screen.getByRole('combobox', { name: 'Workspace' })).toBeDisabled();
  });

  it('shows who is signed in, in which workspace, with My account and Sign out', () => {
    renderSidebar(['view_dashboard']);

    expect(screen.getByText('Hendrik Smit')).toBeInTheDocument();
    expect(screen.getByText('Manager · Acme Digital')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'My account' })).toHaveAttribute('href', '/dashboard/account');
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
  });
});
