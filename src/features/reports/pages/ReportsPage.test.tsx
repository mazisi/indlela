import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderAt } from '@/test/renderWithProviders';
import * as api from '../api/reportsApi';
import { row, schedule, site } from '../test/fixtures';
import ReportsPage from './ReportsPage';

vi.mock('../api/reportsApi');
vi.mock('@/utils/showToaster', () => ({ default: vi.fn() }));

const permissions = vi.hoisted(() => ({ list: [] as string[] }));
vi.mock('@/contexts/PermissionContextType', () => ({
  usePermissions: () => ({ hasPermission: (p: string) => permissions.list.includes(p) }),
}));

const PATH = '/dashboard/reports';
const renderPage = () => renderAt(PATH, [{ path: PATH, element: <ReportsPage /> }, { path: `${PATH}/:siteId`, element: <p>Site reports</p> }]);
const table = () => screen.getAllByRole('table')[0];

describe('ReportsPage (overview)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    permissions.list = ['view_reports', 'create_reports', 'delete_reports'];
  });

  it('lists each site with its last report, delivery markers and schedule', async () => {
    vi.mocked(api.getReportSites).mockResolvedValue([
      site({ lastReport: row({ sentAt: '2026-11-02T09:00:00+02:00', sentTo: ['thandi@karoocoffee.co.za'], share: { url: 'http://localhost:5173/r/abc', expiresAt: null } }) }),
      site({ id: 8, name: 'Durban Dental', client: { id: 3, name: 'Durban Dental' }, lastReport: row({ id: 50, status: 'generating', periodLabel: 'November 2026' }), schedule: null }),
      site({ id: 9, name: 'Joburg Hire', client: { id: 2, name: 'Joburg Hire' }, lastReport: null, schedule: schedule({ isActive: false }) }),
    ]);
    renderPage();

    await screen.findAllByText('Karoo Coffee');
    const rows = within(table()).getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Durban Dental');
    expect(rows[1]).toHaveTextContent('November 2026');
    expect(rows[1]).toHaveTextContent('Generating…');
    expect(rows[1]).toHaveTextContent('Off');
    expect(rows[2]).toHaveTextContent('Joburg Hire');
    expect(rows[2]).toHaveTextContent('No reports yet');
    const karoo = rows[3];
    expect(karoo).toHaveTextContent('October 2026');
    expect(karoo).toHaveTextContent('Ready');
    expect(karoo).toHaveTextContent('Sent');
    expect(karoo).toHaveTextContent('Shared');
    expect(karoo).toHaveTextContent('Monthly on the 1st at 08:00 · 2 recipients');

    expect(screen.getByText('Monthly schedules').parentElement).toHaveTextContent('1 / 3');
  });

  it('opens a site from its row and generates from the row action', async () => {
    vi.mocked(api.getReportSites).mockResolvedValue([site()]);
    renderPage();

    await screen.findAllByText('Karoo Coffee');
    await userEvent.click(within(table()).getByRole('button', { name: 'Generate a report for Karoo Coffee' }));
    const drawer = await screen.findByRole('dialog', { name: 'Generate report' });
    expect(within(drawer).getByText('Reports · Karoo Coffee')).toBeInTheDocument();
    await userEvent.click(within(drawer).getByRole('button', { name: 'Cancel' }));

    await userEvent.click(within(table()).getByRole('button', { name: /^Karoo Coffee/ }));
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(`${PATH}/7`));
  });

  it('hides Generate from a view-only role (Client)', async () => {
    permissions.list = ['view_reports'];
    vi.mocked(api.getReportSites).mockResolvedValue([site()]);
    renderPage();

    await screen.findAllByText('Karoo Coffee');
    expect(screen.queryByRole('button', { name: /Generate a report/ })).not.toBeInTheDocument();
  });

  it('points to Sites when there are none', async () => {
    vi.mocked(api.getReportSites).mockResolvedValue([]);
    renderPage();

    expect(await screen.findByRole('heading', { name: 'No sites to report on yet' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to Sites' })).toHaveAttribute('href', '/dashboard/clients/sites');
  });

  it('says when the sites could not load, with a retry', async () => {
    vi.mocked(api.getReportSites).mockRejectedValueOnce(new Error('down')).mockResolvedValueOnce([site()]);
    renderPage();

    expect(await screen.findByText('We could not load the sites.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect((await screen.findAllByText('Karoo Coffee')).length).toBeGreaterThan(0);
  });
});
