import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderAt } from '@/test/renderWithProviders';
import * as api from '../api/siteAuditApi';
import { audit, site } from '../test/fixtures';
import SiteAuditPage from './SiteAuditPage';

vi.mock('../api/siteAuditApi');

const PATH = '/dashboard/site-audit';
const renderPage = () => renderAt(PATH, [{ path: PATH, element: <SiteAuditPage /> }, { path: `${PATH}/:siteId`, element: <p>Detail page</p> }]);
const table = () => screen.getAllByRole('table')[0];

describe('SiteAuditPage (overview)', () => {
  beforeEach(() => vi.resetAllMocks());

  it('lists each site with health, issues, changes, last audit and schedule', async () => {
    vi.mocked(api.getAuditSites).mockResolvedValue([
      site(),
      site({ id: 8, name: 'Joburg Hire', client: { id: 2, name: 'Joburg Hire (Pty) Ltd' }, latestAudit: null, auditSchedule: 'off', auditPageLimit: 200 }),
      site({ id: 9, name: 'Durban Dental', client: { id: 3, name: 'Durban Dental' }, latestAudit: audit({ id: 60, siteId: 9, healthScore: 41, comparison: null, counts: { critical: 9, warning: 2, notice: 0, total: 11 } }) }),
    ]);
    renderPage();

    await screen.findAllByText('Karoo Coffee');
    const rows = within(table()).getAllByRole('row');
    // Sorted by client, then site.
    expect(rows[1]).toHaveTextContent('Durban Dental');
    expect(rows[2]).toHaveTextContent('Joburg Hire');
    expect(rows[3]).toHaveTextContent('Karoo Coffee');

    const karoo = rows[3];
    expect(within(karoo).getByText('82')).toHaveClass('text-ok');
    expect(within(karoo).getByRole('img', { name: '3 critical, 14 warnings, 35 notices' })).toBeInTheDocument();
    expect(karoo).toHaveTextContent('12 fixed·3 new');
    expect(karoo).toHaveTextContent('19/11/2026');
    expect(karoo).toHaveTextContent('Weekly · 500 pages');

    expect(within(rows[1]).getByText('41')).toHaveClass('text-bad');
    expect(rows[1]).toHaveTextContent('First audit');
    expect(rows[2]).toHaveTextContent('Never audited');
    expect(rows[2]).toHaveTextContent('Manual only · 200 pages');

    // Summary tiles.
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
    expect(screen.getByText('62')).toBeInTheDocument(); // (82 + 41) / 2
    expect(screen.getByText('12')).toBeInTheDocument(); // critical on the latest audits
  });

  it('shows a running audit with its progress and opens a site from its row', async () => {
    vi.mocked(api.getAuditSites).mockResolvedValue([site({ runningAudit: audit({ id: 50, status: 'crawling', pagesCrawled: 143, pagesFound: 900, pageLimit: 500 }) })]);
    renderPage();

    expect((await screen.findAllByText('Crawling… 143 / 500 pages')).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('progressbar', { name: 'Audit progress' })[0]).toHaveAttribute('aria-valuenow', '29');

    await userEvent.click(within(table()).getByRole('button', { name: /Karoo Coffee/ }));
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(`${PATH}/7`));
  });

  it('filters by site or client', async () => {
    vi.mocked(api.getAuditSites).mockResolvedValue([site(), site({ id: 8, name: 'Joburg Hire', client: { id: 2, name: 'Joburg Hire (Pty) Ltd' } })]);
    renderPage();
    await screen.findAllByText('Karoo Coffee');

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search sites or clients' }), 'pty');
    expect(within(table()).queryByText('Karoo Coffee')).not.toBeInTheDocument();
    expect(within(table()).getByText('Joburg Hire')).toBeInTheDocument();

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search sites or clients' }), 'zzz');
    expect(screen.getByText('No sites match “ptyzzz”')).toBeInTheDocument();
  });

  it('points to Sites when there are none', async () => {
    vi.mocked(api.getAuditSites).mockResolvedValue([]);
    renderPage();

    expect(await screen.findByRole('heading', { name: 'No sites to audit yet' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to Sites' })).toHaveAttribute('href', '/dashboard/clients/sites');
  });

  it('offers a retry when the sites fail to load', async () => {
    vi.mocked(api.getAuditSites).mockRejectedValueOnce(Object.assign(new Error('x'), { response: { status: 500, data: { message: 'Server error' } } }));
    vi.mocked(api.getAuditSites).mockResolvedValue([]);
    renderPage();

    expect(await screen.findByText('Server error')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { name: 'No sites to audit yet' })).toBeInTheDocument();
  });
});
