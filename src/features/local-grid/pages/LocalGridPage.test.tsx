import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderAt } from '@/test/renderWithProviders';
import * as api from '../api/localGridApi';
import { scan, site, usage } from '../test/fixtures';
import LocalGridPage from './LocalGridPage';

vi.mock('../api/localGridApi');

const PATH = '/dashboard/local-grid';
const MONEY = /\$|cost|balance|price|credit|dataforseo|top up/i;
const renderPage = () => renderAt(PATH, [{ path: PATH, element: <LocalGridPage /> }, { path: `${PATH}/:siteId`, element: <p>Site page</p> }]);
const table = () => screen.getAllByRole('table')[0];

describe('LocalGridPage (overview)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.getLocalGridUsage).mockResolvedValue(usage());
  });

  it('lists each site with its grids and latest scan, without any money', async () => {
    vi.mocked(api.getLocalGridSites).mockResolvedValue([
      site(),
      site({ id: 8, name: 'Joburg Hire', client: { id: 2, name: 'Joburg Hire (Pty) Ltd' }, gridsCount: 0, latestScan: null }),
      site({ id: 9, name: 'Durban Dental', client: { id: 3, name: 'Durban Dental' }, gridsCount: 1, latestScan: scan({ keyword: 'dentist durban', status: 'running', pointsDone: 3, arp: null, solv: null }) }),
    ]);
    renderPage();

    await screen.findAllByText('Karoo Coffee');
    const rows = within(table()).getAllByRole('row');
    expect(within(table()).getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['Site', 'Grids', 'Latest scan', 'Avg rank', 'Top 3 share', 'When']);
    // Sorted by client, then site.
    expect(rows[1]).toHaveTextContent('Durban Dental');
    expect(rows[2]).toHaveTextContent('Joburg Hire');
    expect(rows[3]).toHaveTextContent('Karoo Coffee');

    expect(rows[3]).toHaveTextContent('coffee shop');
    expect(rows[3]).toHaveTextContent('4.3');
    expect(rows[3]).toHaveTextContent('44%');
    expect(rows[3]).toHaveTextContent('19/11/2026');
    expect(rows[1]).toHaveTextContent('Scanning');
    expect(rows[2]).toHaveTextContent('No grids');

    const strip = screen.getByRole('region', { name: 'Local grid usage' });
    expect(within(strip).getByTestId('grids-used')).toHaveTextContent('3 of 10');
    expect(within(strip).getByTestId('scans-today')).toHaveTextContent('2 of 10');
    expect(document.body.textContent).not.toMatch(MONEY);
  });

  it('opens a site from its row', async () => {
    vi.mocked(api.getLocalGridSites).mockResolvedValue([site()]);
    renderPage();
    await screen.findAllByText('Karoo Coffee');
    await userEvent.click(within(table()).getByRole('button', { name: /Karoo Coffee/ }));
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(`${PATH}/7`));
  });

  it('filters by site, client or keyword', async () => {
    vi.mocked(api.getLocalGridSites).mockResolvedValue([site(), site({ id: 8, name: 'Joburg Hire', client: null, latestScan: scan({ keyword: 'party hire' }) })]);
    renderPage();
    await screen.findAllByText('Karoo Coffee');

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search sites, clients or keywords' }), 'party');
    expect(within(table()).getAllByRole('row')).toHaveLength(2);
    expect(table()).toHaveTextContent('Joburg Hire');

    await userEvent.clear(screen.getByRole('searchbox'));
    await userEvent.type(screen.getByRole('searchbox'), 'nothing like it');
    expect(screen.getByText('No sites match “nothing like it”')).toBeInTheDocument();
  });

  it('has a paginator', async () => {
    vi.mocked(api.getLocalGridSites).mockResolvedValue(Array.from({ length: 20 }, (_, i) => site({ id: 100 + i, name: `Site ${String(i).padStart(2, '0')}` })));
    renderPage();
    await screen.findAllByText('Site 00');
    expect(within(table()).getAllByRole('row')).toHaveLength(16);
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  it('says calmly when scans are paused, and turns the bars red at the limit', async () => {
    vi.mocked(api.getLocalGridSites).mockResolvedValue([site()]);
    vi.mocked(api.getLocalGridUsage).mockResolvedValue(usage({ paused: true, grids: { used: 10, limit: 10 } }));
    renderPage();

    const notice = await screen.findByRole('status', { name: 'Local grid scans paused' });
    expect(notice).toHaveTextContent('Local grid scans are paused for now. Your grids are safe and scans resume automatically.');
    expect(screen.getByRole('progressbar', { name: 'Active grids' })).toHaveAttribute('data-level', 'full');
    expect(screen.getByRole('region', { name: 'Local grid usage' })).toHaveTextContent('Limit reached');
    expect(document.body.textContent).not.toMatch(MONEY);
  });

  it('points to Sites when there are none', async () => {
    vi.mocked(api.getLocalGridSites).mockResolvedValue([]);
    renderPage();
    expect(await screen.findByRole('heading', { name: 'No sites yet' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to Sites' })).toHaveAttribute('href', '/dashboard/clients/sites');
  });
});
