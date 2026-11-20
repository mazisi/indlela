import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { apiError, renderAt } from '@/test/renderWithProviders';
import showToaster from '@/utils/showToaster';
import * as api from '../api/siteAuditApi';
import { ISSUES, PREVIOUS, VITALS, audit, page, site } from '../test/fixtures';
import type { Audit, AuditSite, CrawledPage, CrawledPageDetail } from '../types';
import SiteAuditDetailPage from './SiteAuditDetailPage';

vi.mock('../api/siteAuditApi');
vi.mock('@/utils/showToaster', () => ({ default: vi.fn() }));

const permissions = vi.hoisted(() => ({ list: [] as string[] }));
vi.mock('@/contexts/PermissionContextType', () => ({
  usePermissions: () => ({ hasPermission: (p: string) => permissions.list.includes(p) }),
}));

const MANAGER = ['view_site_audit', 'update_site_audit'];
const VIEWER = ['view_site_audit'];

const PATH = '/dashboard/site-audit';
const renderPage = (path = `${PATH}/7`) => renderAt(path, [{ path: `${PATH}/:siteId`, element: <SiteAuditDetailPage /> }]);
const location = () => screen.getByTestId('location').textContent ?? '';

const CRAWLED: CrawledPage = {
  id: 901,
  url: 'https://www.karoocoffee.co.za/shop',
  depth: 1,
  statusCode: 200,
  finalUrl: null,
  contentType: 'text/html',
  responseMs: 420,
  title: 'Shop coffee beans online | Karoo Coffee',
  metaDescription: null,
  h1: 'Shop',
  h1Count: 1,
  canonical: 'https://www.karoocoffee.co.za/shop',
  metaRobots: null,
  isIndexable: true,
  inSitemap: true,
  inlinksCount: 12,
  outlinksCount: 40,
  wordCount: 640,
  imagesCount: 8,
  imagesMissingAlt: 2,
  issuesCount: 2,
};

const CRAWLED_DETAIL: CrawledPageDetail = {
  ...CRAWLED,
  redirectChain: null,
  xRobotsTag: null,
  missingAltImages: ['https://www.karoocoffee.co.za/img/a.jpg'],
  issues: [
    { type: 'missing_meta_description', severity: 'warning', title: 'Missing meta description', details: null },
    { type: 'missing_alt', severity: 'notice', title: 'Images without alt text', details: { images: ['https://www.karoocoffee.co.za/img/a.jpg'] } },
  ],
  inlinks: [{ pageId: 1, url: 'https://www.karoocoffee.co.za/', nofollow: false }],
  inlinksTotal: 12,
};

/** Sites, history and audits by id, as the API would answer. */
function serve({ sites = [site()], audits = [audit(), PREVIOUS] }: { sites?: AuditSite[]; audits?: Audit[] } = {}) {
  vi.mocked(api.getAuditSites).mockResolvedValue(sites);
  vi.mocked(api.getAudits).mockResolvedValue(page(audits));
  vi.mocked(api.getAudit).mockImplementation(async (id) => {
    const found = audits.find((a) => a.id === id) ?? sites.flatMap((s) => [s.latestAudit, s.runningAudit]).find((a) => a?.id === id);
    if (!found) throw apiError(404, { message: 'Audit not found.' });
    return found;
  });
  vi.mocked(api.getIssueGroups).mockResolvedValue(ISSUES);
  vi.mocked(api.getVitals).mockResolvedValue(VITALS);
  vi.mocked(api.getCrawledPages).mockResolvedValue(page([CRAWLED]));
  vi.mocked(api.getCrawledPage).mockResolvedValue(CRAWLED_DETAIL);
  vi.mocked(api.getAffectedUrls).mockResolvedValue(
    page([
      {
        id: 1,
        url: 'https://www.karoocoffee.co.za/old-shop',
        pageId: 3,
        isNew: true,
        details: { chain: [{ url: 'https://www.karoocoffee.co.za/old-shop', statusCode: 301 }, { url: 'https://www.karoocoffee.co.za/shop', statusCode: 200 }] },
      },
    ]),
  );
}

describe('SiteAuditDetailPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    permissions.list = MANAGER;
  });

  describe('a finished audit', () => {
    it('shows the health score, severity counts and what changed since the previous audit', async () => {
      serve();
      renderPage();

      expect(await screen.findByRole('img', { name: 'Health score 82 out of 100: Good' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Karoo Coffee' })).toBeInTheDocument();
      expect(screen.getByText('Site audit · Karoo Coffee Co')).toBeInTheDocument();
      expect(screen.getByText('Critical issues').closest('button')).toHaveTextContent('3');
      expect(screen.getByText('Warnings').closest('button')).toHaveTextContent('14');
      expect(screen.getByText('Notices').closest('button')).toHaveTextContent('35');
      expect(await screen.findByTestId('comparison-text')).toHaveTextContent('12 issues fixed, 3 new since 14/11/2026.');
      expect(screen.getByText('Pages crawled').nextSibling).toHaveTextContent('312 of 500 max');
      expect(api.getAudit).toHaveBeenCalledWith(41);
    });

    it('lists what changed when a figure in the banner is clicked', async () => {
      serve();
      vi.mocked(api.getComparison).mockResolvedValue(page([{ id: 1, type: 'broken_link', severity: 'critical', title: 'Broken internal links', url: 'https://www.karoocoffee.co.za/contact' }]));
      renderPage();

      await userEvent.click(await screen.findByRole('button', { name: '3 new' }));
      const drawer = await screen.findByRole('dialog');
      expect(within(drawer).getByText('Changes since 14/11/2026')).toBeInTheDocument();
      expect((await within(drawer).findAllByText('Broken internal links')).length).toBeGreaterThan(0);
      expect(api.getComparison).toHaveBeenCalledWith(41, 'new', { page: 1, perPage: 15 });
    });

    it('groups issues by severity; an issue opens to why, how to fix and the affected URLs with their details', async () => {
      serve();
      renderPage();

      const critical = await screen.findByRole('region', { name: /Critical issues/ });
      const warning = screen.getByRole('region', { name: /Warnings/ });
      const notice = screen.getByRole('region', { name: /Notices/ });
      expect(within(critical).getByText('Broken internal links')).toBeInTheDocument();
      expect(within(notice).getByText('2 new')).toBeInTheDocument();
      // Ordered critical → warning → notice.
      expect(critical.compareDocumentPosition(warning) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(warning.compareDocumentPosition(notice) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

      const toggle = within(warning).getByRole('button', { name: /Redirect chains/ });
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await userEvent.click(toggle);
      expect(toggle).toHaveAttribute('aria-expanded', 'true');
      expect(within(warning).getByText('Why it matters')).toBeInTheDocument();
      expect(within(warning).getByText(/wastes Google’s crawl budget/)).toBeInTheDocument();
      expect(within(warning).getByText('Point links straight at the final address.')).toBeInTheDocument();
      expect((await within(warning).findAllByRole('list', { name: 'Redirect chain of 2 steps' })).length).toBeGreaterThan(0);
      expect(api.getAffectedUrls).toHaveBeenCalledWith(41, 'redirect_chain', { page: 1, perPage: 15, search: undefined });

      await userEvent.click(toggle);
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
    });

    it('opens an older audit from History and goes back to the latest', async () => {
      serve();
      renderPage(`${PATH}/7?tab=history`);

      expect(await screen.findByRole('heading', { name: 'Health score over time' })).toBeInTheDocument();
      await userEvent.click((await screen.findAllByRole('button', { name: /Open the audit of 14\/11\/2026/ }))[0]);
      await waitFor(() => expect(location()).toBe(`${PATH}/7?audit=40`));
      expect(await screen.findByText(/You're looking at the audit of 14\/11\/2026/)).toBeInTheDocument();
      expect(await screen.findByRole('img', { name: 'Health score 74 out of 100: Needs work' })).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'Show the latest audit' }));
      await waitFor(() => expect(location()).toBe(`${PATH}/7`));
    });

    it('filters crawled pages from the URL and opens a page in a drawer', async () => {
      serve();
      renderPage(`${PATH}/7?tab=pages`);

      expect((await screen.findAllByText('Shop coffee beans online | Karoo Coffee')).length).toBeGreaterThan(0);
      await userEvent.click(screen.getByRole('combobox', { name: 'Status' }));
      await userEvent.click(await screen.findByRole('option', { name: '4xx · Not found' }));
      await waitFor(() => expect(location()).toContain('status=4xx'));
      await waitFor(() => expect(api.getCrawledPages).toHaveBeenLastCalledWith(41, expect.objectContaining({ status: '4xx', page: 1, perPage: 15 })));

      await userEvent.click(screen.getAllByRole('button', { name: '/shop' })[0]);
      const drawer = await screen.findByRole('dialog');
      expect(await within(drawer).findByText('Missing meta description')).toBeInTheDocument();
      expect(within(drawer).getByText('Issues (2)')).toBeInTheDocument();
      expect(within(drawer).getByText('Linked from (12)')).toBeInTheDocument();
      expect(api.getCrawledPage).toHaveBeenCalledWith(41, 901);
    });

    it('shows Core Web Vitals per device with field data, falling back to lab data', async () => {
      serve();
      renderPage(`${PATH}/7?tab=vitals`);

      expect(await screen.findByRole('img', { name: 'Performance score 48 out of 100: Poor' })).toBeInTheDocument();
      expect(screen.getByText('Real-user data (Chrome, last 28 days)')).toBeInTheDocument();
      expect(screen.getByText('Lab data: too few visits for real-user data')).toBeInTheDocument();
      expect(screen.getByLabelText('INP 520 ms: Poor')).toBeInTheDocument();
      expect(screen.getByLabelText('TBT 150 ms: Good')).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'Desktop' }));
      expect(screen.getByRole('img', { name: 'Performance score 97 out of 100: Good' })).toBeInTheDocument();
      expect(screen.queryByRole('img', { name: /Performance score 48/ })).not.toBeInTheDocument();
    });

    it('explains that an older audit keeps only its summary', async () => {
      const old = { ...PREVIOUS, detailsPruned: true };
      serve({ audits: [audit(), old] });
      renderPage(`${PATH}/7?audit=40`);

      expect(await screen.findByText('The issue list of this audit is no longer kept')).toBeInTheDocument();
      expect(api.getIssueGroups).not.toHaveBeenCalled();
    });

    it("explains when Core Web Vitals aren't available", async () => {
      const unavailable = audit({ vitalsStatus: 'unavailable', vitalsMessage: 'No PageSpeed Insights API key is set for this workspace.' });
      serve({ sites: [site({ latestAudit: unavailable })], audits: [unavailable, PREVIOUS] });
      renderPage(`${PATH}/7?tab=vitals`);

      expect(await screen.findByText("Core Web Vitals aren't available for this audit")).toBeInTheDocument();
      expect(screen.getByText('No PageSpeed Insights API key is set for this workspace.')).toBeInTheDocument();
      expect(api.getVitals).not.toHaveBeenCalled();
    });
  });

  describe('states', () => {
    it('asks to run the first audit, listing what it checks', async () => {
      serve({ sites: [site({ latestAudit: null })], audits: [] });
      vi.mocked(api.startAudit).mockResolvedValue(audit({ id: 50, status: 'queued', healthScore: null, pagesCrawled: 0, pagesFound: 0, finishedAt: null }));
      renderPage();

      expect(await screen.findByRole('heading', { name: 'Run your first audit' })).toBeInTheDocument();
      expect(screen.getByText('Core Web Vitals')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Run audit' })).not.toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Run first audit' }));

      await waitFor(() => expect(api.startAudit).toHaveBeenCalledWith(7));
      expect(showToaster).toHaveBeenCalledWith('success', 'Audit of Karoo Coffee started.');
      expect(await screen.findByRole('heading', { name: 'Auditing the site…' })).toBeInTheDocument();
      expect(screen.getByText('Waiting in the queue…')).toBeInTheDocument();
    });

    it('shows a failed first audit with a retry', async () => {
      const failed = audit({ status: 'failed', error: 'The site did not respond within 30 seconds.', healthScore: null, comparison: null });
      serve({ sites: [site({ latestAudit: null })], audits: [failed] });
      renderPage();

      expect(await screen.findByRole('heading', { name: "The audit didn't finish" })).toBeInTheDocument();
      expect(screen.getByText(/The site did not respond within 30 seconds/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    });

    it('keeps showing the last done audit when the latest failed', async () => {
      const failed = audit({ id: 45, status: 'failed', error: 'Timed out', finishedAt: '2026-11-20T06:00:00+02:00' });
      serve({ sites: [site()], audits: [failed, audit(), PREVIOUS] });
      renderPage();

      expect(await screen.findByText(/The latest audit failed on 20\/11\/2026 06:00: Timed out/)).toBeInTheDocument();
      expect(await screen.findByRole('img', { name: 'Health score 82 out of 100: Good' })).toBeInTheDocument();
    });

    it('says when the site is not there', async () => {
      serve();
      renderPage(`${PATH}/99`);
      expect(await screen.findByRole('heading', { name: 'Site not found' })).toBeInTheDocument();
    });
  });

  describe('running an audit', () => {
    beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
    afterEach(() => vi.useRealTimers());

    it('starts, polls every 3 s with progress, then refreshes when done', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      serve();
      const queued = audit({ id: 50, status: 'queued', healthScore: null, pagesCrawled: 0, pagesFound: 0, finishedAt: null, comparison: null });
      const crawling = { ...queued, status: 'crawling' as const, pagesCrawled: 143, pagesFound: 610 };
      const finished = audit({ id: 50, healthScore: 88, finishedAt: '2026-11-20T10:00:00+02:00', comparison: { fixed: 5, new: 1, persisting: 44, previousAuditId: 41 } });
      vi.mocked(api.startAudit).mockResolvedValue(queued);
      vi.mocked(api.getAudit).mockImplementation(async (id) => (id === 50 ? crawling : id === 40 ? PREVIOUS : audit()));
      renderPage();

      await user.click(await screen.findByRole('button', { name: 'Run audit' }));
      await waitFor(() => expect(api.startAudit).toHaveBeenCalledWith(7));
      expect(await screen.findByRole('progressbar', { name: 'Audit progress' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Run audit' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel audit' })).toBeInTheDocument();

      await act(() => vi.advanceTimersByTimeAsync(3_000));
      expect(await screen.findByText('Crawling… 143 / 500 pages')).toBeInTheDocument();

      vi.mocked(api.getAudit).mockImplementation(async (id) => (id === 50 ? finished : id === 40 ? PREVIOUS : audit()));
      vi.mocked(api.getAuditSites).mockResolvedValue([site({ latestAudit: finished, runningAudit: null })]);
      vi.mocked(api.getAudits).mockResolvedValue(page([finished, audit(), PREVIOUS]));
      const sitesCalls = vi.mocked(api.getAuditSites).mock.calls.length;
      await act(() => vi.advanceTimersByTimeAsync(3_000));

      await waitFor(() => expect(showToaster).toHaveBeenCalledWith('success', 'Audit of Karoo Coffee finished. Health score 88. 5 issues fixed, 1 new.'));
      await waitFor(() => expect(vi.mocked(api.getAuditSites).mock.calls.length).toBeGreaterThan(sitesCalls));
      expect(await screen.findByRole('img', { name: 'Health score 88 out of 100: Good' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Run audit' })).toBeInTheDocument();
      expect(showToaster).toHaveBeenCalledTimes(2);
    });

    it('cancels a running audit after confirming', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const crawling = audit({ id: 50, status: 'crawling', healthScore: null, pagesCrawled: 20, pagesFound: 80, finishedAt: null, comparison: null });
      serve({ sites: [site({ runningAudit: crawling })], audits: [audit(), PREVIOUS] });
      vi.mocked(api.cancelAudit).mockResolvedValue({ ...crawling, status: 'cancelled', finishedAt: '2026-11-20T10:00:00+02:00' });
      renderPage();

      expect(await screen.findByText('Crawling… 20 / 80 pages')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Cancel audit' }));
      const dialog = await screen.findByRole('alertdialog');
      expect(dialog).toHaveTextContent('The crawl stops and nothing from this run is kept.');
      vi.mocked(api.getAuditSites).mockResolvedValue([site()]);
      await user.click(within(dialog).getByRole('button', { name: 'Cancel audit' }));

      await waitFor(() => expect(api.cancelAudit).toHaveBeenCalledWith(50));
      await waitFor(() => expect(showToaster).toHaveBeenCalledWith('default', 'The audit of Karoo Coffee was cancelled.'));
      expect(await screen.findByRole('button', { name: 'Run audit' })).toBeInTheDocument();
    });
  });

  it('says so when an audit is already running (409)', async () => {
    serve();
    vi.mocked(api.startAudit).mockRejectedValue(apiError(409, { message: 'An audit of this site is already running.', error_type: 'audit_running' }));
    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Run audit' }));
    await waitFor(() => expect(showToaster).toHaveBeenCalledWith('default', 'An audit of this site is already running.'));
    await waitFor(() => expect(vi.mocked(api.getAuditSites).mock.calls.length).toBeGreaterThan(1));
  });

  describe('permissions', () => {
    it('shows view-only users progress but no Run, Cancel or Settings', async () => {
      permissions.list = VIEWER;
      const crawling = audit({ id: 50, status: 'crawling', healthScore: null, pagesCrawled: 20, pagesFound: 80, finishedAt: null, comparison: null });
      serve({ sites: [site({ runningAudit: crawling })] });
      renderPage();

      expect(await screen.findByText('Crawling… 20 / 80 pages')).toBeInTheDocument();
      expect(await screen.findByRole('img', { name: 'Health score 82 out of 100: Good' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Run audit/ })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Cancel audit/ })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Settings/ })).not.toBeInTheDocument();
    });

    it('tells view-only users who to ask for a first audit', async () => {
      permissions.list = VIEWER;
      serve({ sites: [site({ latestAudit: null })], audits: [] });
      renderPage();

      expect(await screen.findByText(/Ask your account manager to run an audit/)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Run first audit' })).not.toBeInTheDocument();
    });

    it('lets managers open the settings drawer', async () => {
      serve();
      renderPage();

      await userEvent.click(await screen.findByRole('button', { name: 'Settings' }));
      expect(await screen.findByRole('dialog', { name: 'Karoo Coffee' })).toBeInTheDocument();
      expect(screen.getByRole('spinbutton', { name: 'Page limit' })).toHaveValue(500);
    });
  });
});
