import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchConsolePage from './SearchConsolePage';
import * as api from '../api/searchConsoleApi';
import { renderAt } from '@/test/renderWithProviders';
import showToaster from '@/utils/showToaster';
import type { GoogleConnection, GscSite, Overview, ReportPage } from '../types';

vi.mock('../api/searchConsoleApi');
vi.mock('@/utils/showToaster', () => ({ default: vi.fn() }));

const permissions = vi.hoisted(() => ({ list: [] as string[] }));
vi.mock('@/contexts/PermissionContextType', () => ({
  usePermissions: () => ({ hasPermission: (p: string) => permissions.list.includes(p) }),
}));

const MANAGER = ['view_search_console', 'update_search_console'];
const VIEWER = ['view_search_console'];

const CONNECTION: GoogleConnection = {
  id: 1,
  googleEmail: 'seo@agency.co.za',
  status: 'active',
  lastError: null,
  connectedBy: { id: 1, name: 'Johan Pretorius' },
  connectedAt: '2026-11-19T10:00:00+02:00',
};

const site = (over: Partial<GscSite> = {}): GscSite => ({
  id: 7,
  name: 'Karoo Coffee',
  url: 'https://www.karoocoffee.co.za',
  client: { id: 1, name: 'Karoo Coffee Co' },
  gscProperty: 'sc-domain:karoocoffee.co.za',
  gscSyncStatus: 'done',
  gscSyncedAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
  gscDataThrough: '2026-11-18',
  gscSyncError: null,
  ...over,
});

const OVERVIEW: Overview = {
  period: { start: '2026-10-22', end: '2026-11-18' },
  comparePeriod: { start: '2026-09-24', end: '2026-10-21' },
  dataThrough: '2026-11-18',
  totals: { clicks: 4321, impressions: 98765, ctr: 0.0437, position: 9.3 },
  compareTotals: { clicks: 4000, impressions: 90000, ctr: 0.0444, position: 10.1 },
  series: [
    { date: '2026-11-17', clicks: 150, impressions: 3200, ctr: 0.047, position: 9.1 },
    { date: '2026-11-18', clicks: 160, impressions: 3300, ctr: 0.048, position: 9.0 },
  ],
  compareSeries: [
    { date: '2026-10-20', clicks: 140, impressions: 3000, ctr: 0.046, position: 10 },
    { date: '2026-10-21', clicks: 130, impressions: 3100, ctr: 0.042, position: 10.2 },
  ],
};

function page<T>(data: T[], total = data.length) {
  return { data, meta: { currentPage: 1, lastPage: Math.ceil(total / 15) || 1, perPage: 15, total, from: 1, to: data.length } };
}

const QUERIES = page([
  { id: 1, query: 'karoo coffee beans', clicks: 820, impressions: 12040, ctr: 0.068, position: 3.2, clicksChange: 41, positionChange: -0.6 },
  { id: 2, query: 'best coffee roastery cape town', clicks: 96, impressions: 8800, ctr: 0.0109, position: 8.7, clicksChange: -12, positionChange: 1.4 },
]) as ReportPage<'queries'>;

const QUICK_WINS = page([
  { id: 1, query: 'coffee subscription south africa', page: 'https://www.karoocoffee.co.za/subscriptions', impressions: 5400, clicks: 38, ctr: 0.007, position: 7.4, potentialClicks: 310 },
]) as ReportPage<'quick-wins'>;

const LOW_CTR = page([
  {
    id: 1,
    page: 'https://www.karoocoffee.co.za/shop/espresso',
    impressions: 7200,
    clicks: 40,
    ctr: 0.0056,
    expectedCtr: 0.072,
    position: 3.1,
    missedClicks: 478,
    topQueries: ['espresso beans', 'buy espresso online', 'dark roast'],
  },
]) as ReportPage<'low-ctr'>;

const DECAY = page([
  {
    id: 1,
    page: 'https://www.karoocoffee.co.za/blog/brew-guide',
    clicksLast28: 210,
    clicksPrev28: 340,
    clicksChangePct: -38.2,
    monthly: [
      { month: '2026-06', clicks: 520 },
      { month: '2026-07', clicks: 480 },
      { month: '2026-08', clicks: 430 },
      { month: '2026-09', clicks: 390 },
      { month: '2026-10', clicks: 340 },
      { month: '2026-11', clicks: 210 },
    ],
    declineMonths: 5,
  },
]) as ReportPage<'content-decay'>;

const PATH = '/dashboard/search-console';
const renderPage = (path = PATH) => renderAt(path, [{ path: PATH, element: <SearchConsolePage /> }]);
const location = () => screen.getByTestId('location').textContent ?? '';

function ready() {
  vi.mocked(api.getGoogleConnection).mockResolvedValue(CONNECTION);
  vi.mocked(api.getGscSites).mockResolvedValue([site()]);
  vi.mocked(api.getOverview).mockResolvedValue(OVERVIEW);
  vi.mocked(api.getReport).mockImplementation(async (report) => {
    const pages = { queries: QUERIES, 'quick-wins': QUICK_WINS, 'low-ctr': LOW_CTR, 'content-decay': DECAY, pages: page([]) };
    return pages[report] as never;
  });
}

describe('SearchConsolePage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    permissions.list = MANAGER;
  });

  describe('states', () => {
    it('offers to connect Google when there is no connection', async () => {
      vi.mocked(api.getGoogleConnection).mockResolvedValue(null);
      vi.mocked(api.connectGoogle).mockResolvedValue('https://accounts.google.com/o/oauth2/auth?x=1');
      const assign = vi.fn();
      vi.stubGlobal('location', { ...window.location, assign });
      renderPage();

      await userEvent.click(await screen.findByRole('button', { name: 'Connect Google Search Console' }));

      await waitFor(() => expect(assign).toHaveBeenCalledWith('https://accounts.google.com/o/oauth2/auth?x=1'));
      expect(api.getGscSites).not.toHaveBeenCalled();
      vi.unstubAllGlobals();
    });

    it('asks to link a property, preselecting the one matching the site', async () => {
      vi.mocked(api.getGoogleConnection).mockResolvedValue(CONNECTION);
      const importing = site({ gscSyncStatus: 'queued', gscSyncedAt: null, gscDataThrough: null });
      vi.mocked(api.getGscSites).mockResolvedValueOnce([site({ gscProperty: null, gscSyncedAt: null, gscDataThrough: null, gscSyncStatus: 'idle' })]).mockResolvedValue([importing]);
      vi.mocked(api.getGoogleProperties).mockResolvedValue([
        { siteUrl: 'sc-domain:karoocoffee.co.za', permissionLevel: 'siteOwner' },
        { siteUrl: 'https://other.co.za/', permissionLevel: 'siteFullUser' },
      ]);
      vi.mocked(api.linkProperty).mockResolvedValue(importing);
      renderPage();

      expect(await screen.findByRole('heading', { name: 'Link Karoo Coffee to Search Console' })).toBeInTheDocument();
      await userEvent.click(await screen.findByRole('button', { name: 'Link property' }));

      await waitFor(() => expect(api.linkProperty).toHaveBeenCalledWith(7, 'sc-domain:karoocoffee.co.za'));
      expect(showToaster).toHaveBeenCalledWith('success', expect.stringContaining('Karoo Coffee linked'));
      expect(await screen.findByRole('heading', { name: 'Importing up to 16 months of data…' })).toBeInTheDocument();
    });

    it('shows the import in progress while a linked site has no data yet', async () => {
      vi.mocked(api.getGoogleConnection).mockResolvedValue(CONNECTION);
      vi.mocked(api.getGscSites).mockResolvedValue([site({ gscSyncStatus: 'syncing', gscDataThrough: null })]);
      renderPage();

      expect(await screen.findByRole('heading', { name: 'Importing up to 16 months of data…' })).toBeInTheDocument();
      expect(screen.getByText('Syncing…')).toBeInTheDocument();
      expect(api.getOverview).not.toHaveBeenCalled();
    });

    it('shows the dashboard for a linked site with data', async () => {
      ready();
      renderPage();

      expect(await screen.findByText('4,321')).toBeInTheDocument();
      expect(screen.getByText('98,765')).toBeInTheDocument();
      expect(screen.getByText('4.4%')).toBeInTheDocument();
      expect(screen.getByText('9.3')).toBeInTheDocument();
      expect(screen.getByText(/Synced 2 h ago · data through 18\/11\/2026/)).toBeInTheDocument();
      // 28 days ending on the last day with data, compared with the previous period.
      expect(api.getOverview).toHaveBeenCalledWith(expect.objectContaining({ siteId: 7, start: '2026-10-22', end: '2026-11-18', compare: 'previous' }));
      expect((await screen.findAllByText('karoo coffee beans')).length).toBeGreaterThan(0);
    });

    it('reads the range and compare from the URL', async () => {
      ready();
      renderPage(`${PATH}?site=7&range=7d&compare=year`);

      await screen.findByText('4,321');
      expect(api.getOverview).toHaveBeenCalledWith(expect.objectContaining({ start: '2026-11-12', end: '2026-11-18', compare: 'year' }));
    });
  });

  describe('Google return', () => {
    it('confirms a connection and drops the params', async () => {
      ready();
      renderPage(`${PATH}?site=7&google=connected`);

      await waitFor(() => expect(showToaster).toHaveBeenCalledWith('success', 'Google Search Console connected.', expect.anything()));
      await waitFor(() => expect(location()).toBe(`${PATH}?site=7`));
    });

    it('shows the error Google sent back', async () => {
      vi.mocked(api.getGoogleConnection).mockResolvedValue(null);
      renderPage(`${PATH}?google=error&message=${encodeURIComponent('You declined access.')}`);

      await waitFor(() => expect(showToaster).toHaveBeenCalledWith('error', 'You declined access.', expect.anything()));
      await waitFor(() => expect(location()).toBe(PATH));
    });
  });

  describe('permissions', () => {
    it('hides Connect from view-only users', async () => {
      permissions.list = VIEWER;
      vi.mocked(api.getGoogleConnection).mockResolvedValue(null);
      renderPage();

      expect(await screen.findByText(/Ask someone who manages this workspace to connect it/)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Connect Google Search Console' })).not.toBeInTheDocument();
    });

    it('hides Sync now, Unlink and Disconnect from view-only users', async () => {
      permissions.list = VIEWER;
      ready();
      renderPage();

      await screen.findByText('4,321');
      expect(screen.queryByRole('button', { name: /Sync now/ })).not.toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: /Google account: seo@agency.co.za/ }));
      expect(await screen.findByText('Connected · by Johan Pretorius · 19/11/2026', { exact: false })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Unlink property' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Disconnect Google' })).not.toBeInTheDocument();
    });

    it('lets managers sync and unlink (after confirming)', async () => {
      ready();
      vi.mocked(api.syncSite).mockResolvedValue(site({ gscSyncStatus: 'queued' }));
      vi.mocked(api.unlinkProperty).mockResolvedValue();
      renderPage();

      await screen.findByText('4,321');
      await userEvent.click(screen.getByRole('button', { name: /Sync now/ }));
      await waitFor(() => expect(api.syncSite).toHaveBeenCalledWith(7));

      await userEvent.click(screen.getByRole('button', { name: /Google account: seo@agency.co.za/ }));
      await userEvent.click(await screen.findByRole('button', { name: 'Unlink property' }));
      const dialog = await screen.findByRole('alertdialog');
      expect(dialog).toHaveTextContent('Search Console data stored for this site is deleted');
      await userEvent.click(within(dialog).getByRole('button', { name: 'Unlink and delete data' }));
      await waitFor(() => expect(api.unlinkProperty).toHaveBeenCalledWith(7));
    });
  });

  describe('reports', () => {
    it('puts sort and search in the URL and sends them to the API', async () => {
      ready();
      renderPage();
      await screen.findAllByText('karoo coffee beans');

      await userEvent.click(screen.getAllByRole('button', { name: 'Impressions' })[0]);
      await waitFor(() => expect(location()).toContain('sort=impressions'));
      await waitFor(() => expect(api.getReport).toHaveBeenLastCalledWith('queries', expect.objectContaining({ sort: { key: 'impressions', direction: 'asc' } })));

      await userEvent.type(screen.getByRole('searchbox', { name: 'Search queries' }), 'roastery');
      await waitFor(() => expect(location()).toContain('search=roastery'));
      await waitFor(() => expect(api.getReport).toHaveBeenLastCalledWith('queries', expect.objectContaining({ search: 'roastery', page: 1, perPage: 15 })));
    });

    it('shows change badges on the queries table', async () => {
      ready();
      renderPage();

      expect((await screen.findAllByRole('img', { name: 'Clicks up 41 vs the compare period' }))[0]).toHaveClass('text-ok');
      expect(screen.getAllByRole('img', { name: 'Position worsened 1.4 vs the compare period' })[0]).toHaveClass('text-bad');
    });

    it('renders quick wins with the potential clicks and the ranking page', async () => {
      ready();
      renderPage(`${PATH}?tab=quick-wins`);

      expect(await screen.findByText(/rank 5–15 with lots of impressions/)).toBeInTheDocument();
      expect((await screen.findAllByText('+310')).length).toBeGreaterThan(0);
      expect(screen.getAllByRole('link', { name: /\/subscriptions/ })[0]).toHaveAttribute('href', 'https://www.karoocoffee.co.za/subscriptions');
    });

    it('renders low CTR with expected CTR, missed clicks and top queries', async () => {
      ready();
      renderPage(`${PATH}?tab=low-ctr`);

      expect(await screen.findByText(/Rewrite the title and meta description/)).toBeInTheDocument();
      expect((await screen.findAllByLabelText('CTR 0.56%, expected 7.2%')).length).toBeGreaterThan(0);
      expect(screen.getAllByText('478').length).toBeGreaterThan(0);
      expect(screen.getAllByText('espresso beans').length).toBeGreaterThan(0);
    });

    it('renders content decay with the change and a trend line', async () => {
      ready();
      renderPage(`${PATH}?tab=content-decay`);

      expect((await screen.findAllByRole('img', { name: 'Clicks down 38.2% vs the previous 28 days' }))[0]).toHaveClass('text-bad');
      expect(screen.getAllByRole('img', { name: /^Clicks by month: Jun 2026 520/ }).length).toBeGreaterThan(0);
      // Content decay ignores the date range.
      expect(api.getReport).toHaveBeenCalledWith('content-decay', expect.objectContaining({ start: undefined, end: undefined }));
    });

    it('switching tabs resets the table state in the URL', async () => {
      ready();
      renderPage(`${PATH}?sort=clicks&direction=desc&page=2`);
      await screen.findAllByText('karoo coffee beans');

      await userEvent.click(screen.getByRole('tab', { name: 'Low CTR' }));
      await waitFor(() => expect(location()).toBe(`${PATH}?tab=low-ctr`));
    });
  });
});
