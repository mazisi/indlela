import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderAt } from '@/test/renderWithProviders';
import { SitePageHeader } from './SitePageHeader';

const permissions = vi.hoisted(() => ({ list: [] as string[] }));
vi.mock('@/contexts/PermissionContextType', () => ({
  usePermissions: () => ({ hasPermission: (p: string) => permissions.list.includes(p) }),
}));

const SITE = { id: 7, name: 'Joburg Hire', url: 'https://www.joburgeventhire.co.za/', client: { name: 'MRN' } };

const renderHeader = (props: Partial<Parameters<typeof SitePageHeader>[0]> = {}) =>
  renderAt('/dashboard/reports/7', [{ path: '/dashboard/reports/:siteId', element: <SitePageHeader module="reports" site={SITE} {...props} /> }]);

describe('SitePageHeader', () => {
  it('shows the breadcrumb, the site, its domain and client', () => {
    permissions.list = ['view_reports'];
    renderHeader({ actions: <button type="button">Generate report</button> });

    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(within(crumbs).getByRole('link', { name: 'Reports' })).toHaveAttribute('href', '/dashboard/reports');
    expect(within(crumbs).getByText('MRN')).toBeInTheDocument();
    expect(within(crumbs).getByText('Joburg Hire')).toHaveAttribute('aria-current', 'page');

    expect(screen.getByRole('heading', { level: 1, name: 'Joburg Hire' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /www\.joburgeventhire\.co\.za/ })).toHaveAttribute('href', SITE.url);
    expect(screen.getByRole('button', { name: 'Generate report' })).toBeInTheDocument();
  });

  it('links to the same site in the other modules the user can open', () => {
    permissions.list = ['view_reports', 'view_site_audit', 'view_search_console'];
    renderHeader();

    const tabs = screen.getByRole('navigation', { name: 'Joburg Hire in other modules' });
    const links = within(tabs).getAllByRole('link');
    expect(links.map((l) => l.textContent)).toEqual(['Search Console', 'Site audit', 'Reports']);
    expect(within(tabs).getByRole('link', { name: 'Search Console' })).toHaveAttribute('href', '/dashboard/search-console?site=7');
    expect(within(tabs).getByRole('link', { name: 'Site audit' })).toHaveAttribute('href', '/dashboard/site-audit/7');
    expect(within(tabs).getByRole('link', { name: 'Reports' })).toHaveAttribute('aria-current', 'page');
  });

  it('has no tabs when the user can open only this module', () => {
    permissions.list = ['view_reports'];
    renderHeader();
    expect(screen.queryByRole('navigation', { name: /other modules/ })).not.toBeInTheDocument();
  });

  it('shows a placeholder while the site loads', () => {
    renderHeader({ site: undefined, loading: true });
    expect(screen.getByRole('heading', { level: 1, name: 'Loading…' })).toBeInTheDocument();
  });
});
