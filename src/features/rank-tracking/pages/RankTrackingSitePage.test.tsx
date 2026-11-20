import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { apiError, renderAt } from '@/test/renderWithProviders';
import showToaster from '@/utils/showToaster';
import * as api from '../api/rankTrackingApi';
import { CANNIBALISED, HISTORY, NOT_RANKING, keyword, page, rankSite, summary, usage } from '../test/fixtures';
import type { RankKeyword, RankSummary, RankUsage } from '../types';
import RankTrackingSitePage from './RankTrackingSitePage';

vi.mock('../api/rankTrackingApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/rankTrackingApi')>();
  return Object.fromEntries(Object.entries(actual).map(([k, v]) => [k, typeof v === 'function' && k !== 'tidyDigitKeys' && k !== 'toApiSort' ? vi.fn() : v]));
});
vi.mock('@/utils/showToaster', () => ({ default: vi.fn() }));

const permissions = vi.hoisted(() => ({ list: [] as string[] }));
vi.mock('@/contexts/PermissionContextType', () => ({
  usePermissions: () => ({ hasPermission: (p: string) => permissions.list.includes(p) }),
}));

const MANAGER = ['view_rank_tracking', 'update_rank_tracking'];
const VIEWER = ['view_rank_tracking'];

const PATH = '/dashboard/rank-tracking';
const renderPage = (path = `${PATH}/7`) => renderAt(path, [{ path: `${PATH}/:siteId`, element: <RankTrackingSitePage /> }]);
const location = () => screen.getByTestId('location').textContent ?? '';
const table = () => {
  const tables = screen.getAllByRole('table');
  return tables[tables.length - 1];
};
/** The keyword's table row, once the list has loaded. */
const findRow = async (text: string) => {
  const cells = await screen.findAllByText(text, { selector: 'td button' });
  return cells[0].closest('tr') as HTMLElement;
};

function serve({
  rows = [keyword(), NOT_RANKING],
  sum = summary(),
  site = rankSite(),
  use = usage(),
}: { rows?: RankKeyword[]; sum?: RankSummary; site?: ReturnType<typeof rankSite>; use?: RankUsage } = {}) {
  vi.mocked(api.getRankSites).mockResolvedValue([site]);
  vi.mocked(api.getRankUsage).mockResolvedValue(use);
  vi.mocked(api.getRankSummary).mockResolvedValue(sum);
  vi.mocked(api.getKeywords).mockResolvedValue(page(rows));
  vi.mocked(api.getKeywordHistory).mockResolvedValue(HISTORY);
  vi.mocked(api.getCannibalisation).mockResolvedValue(page(CANNIBALISED));
}

describe('RankTrackingSitePage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    permissions.list = MANAGER;
  });

  describe('summary', () => {
    it('shows tiles with the week’s change, the distribution, movers, SERP features and cannibalisation', async () => {
      serve();
      renderPage();

      const tiles = await screen.findByRole('group', { name: 'Ranking summary' });
      expect(screen.getByRole('heading', { name: 'Karoo Coffee' })).toBeInTheDocument();
      expect(within(tiles).getByText('Top 3').parentElement).toHaveTextContent('5');
      expect(within(tiles).getByRole('img', { name: 'Top 3 up 2 vs 7 days ago' })).toHaveAttribute('data-tone', 'good');
      // Top 10 counts 1–10: 5 + 9 now, 3 + 9 a week ago.
      expect(within(tiles).getByText('Top 10').parentElement).toHaveTextContent('14');
      expect(within(tiles).getByRole('img', { name: 'Top 10 up 2 vs 7 days ago' })).toBeInTheDocument();
      expect(within(tiles).getByText('34.2%')).toBeInTheDocument();
      // Average position went from 9.4 to 8.2 over the week: lower is better.
      expect(within(tiles).getByRole('img', { name: /Average position improved/ })).toHaveAttribute('data-tone', 'good');

      const distribution = screen.getByRole('list', { name: 'Keywords by position' });
      expect(within(distribution).getByText('Not ranking').closest('li')).toHaveTextContent('3');

      const gains = screen.getByRole('region', { name: 'Biggest gains this week' });
      expect(within(gains).getByText('coffee beans johannesburg')).toBeInTheDocument();
      expect(within(gains).getByRole('img', { name: 'Position up 5 this week' })).toHaveAttribute('data-tone', 'good');
      const drops = screen.getByRole('region', { name: 'Biggest drops this week' });
      expect(within(drops).getByRole('img', { name: 'Position down 7 this week' })).toHaveAttribute('data-tone', 'bad');

      const serp = screen.getByRole('region', { name: 'SERP features' });
      expect(within(serp).getByText('Map pack').closest('div')?.parentElement).toHaveTextContent('Present for 9 keywords · you appear in 4');

      await userEvent.click(screen.getByRole('button', { name: /2 keywords have competing pages/ }));
      await waitFor(() => expect(location()).toBe(`${PATH}/7?tab=cannibalisation`));
    });

    it('opens a mover’s history in a drawer', async () => {
      serve();
      renderPage();

      await userEvent.click(within(await screen.findByRole('region', { name: 'Biggest drops this week' })).getByRole('button', { name: /coffee subscription/ }));
      const drawer = await screen.findByRole('dialog');
      expect(within(drawer).getByText('coffee subscription')).toBeInTheDocument();
      expect(api.getKeywordHistory).toHaveBeenCalledWith(503);

      // Every drawer closes from its footer too.
      const footer = drawer.querySelector('[data-slot="sheet-footer"]') as HTMLElement;
      await userEvent.click(within(footer).getByRole('button', { name: 'Close' }));
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });
  });

  describe('empty states', () => {
    it('invites a manager to add the first keywords', async () => {
      serve({ rows: [], sum: summary({ keywordsCount: 0 }), site: rankSite({ keywordsCount: 0, lastCheckedOn: null }) });
      renderPage();

      expect(await screen.findByRole('heading', { name: 'Add your first keywords' })).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Add keywords' }));
      expect(await screen.findByRole('dialog', { name: 'Add keywords' })).toBeInTheDocument();
    });

    it('tells a viewer to ask for keywords', async () => {
      permissions.list = VIEWER;
      serve({ rows: [], sum: summary({ keywordsCount: 0 }), site: rankSite({ keywordsCount: 0, lastCheckedOn: null }) });
      renderPage();

      expect(await screen.findByText(/Ask your account manager to add some/)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Add keywords/ })).not.toBeInTheDocument();
    });

    it('says when the first positions arrive while nothing has been checked', async () => {
      const pending = keyword({ position: null, change1d: null, change7d: null, change30d: null, bestPosition: null, url: null, serpFeatures: null, lastCheckedOn: null, lastCheckStatus: null, history: [] });
      serve({ rows: [pending], site: rankSite({ lastCheckedOn: null }) });
      renderPage();

      expect(await screen.findByRole('heading', { name: "First positions arrive after tonight's check" })).toBeInTheDocument();
      expect(screen.getByText(/Check now/, { selector: 'span' })).toBeInTheDocument();
      expect(screen.queryByRole('group', { name: 'Ranking summary' })).not.toBeInTheDocument();
      expect(await findRow('coffee beans johannesburg')).toHaveTextContent('Not checked');
    });

    it('says when every keyword is paused, keeping the list', async () => {
      serve({ rows: [keyword({ isActive: false })], sum: summary({ keywordsCount: 0, cannibalisedCount: 0 }) });
      renderPage();

      expect(await screen.findByRole('heading', { name: 'All keywords are paused' })).toBeInTheDocument();
      expect(await findRow('coffee beans johannesburg')).toHaveTextContent('Paused');
      expect(screen.queryByRole('heading', { name: 'Add your first keywords' })).not.toBeInTheDocument();
    });

    it('shows a site that does not exist', async () => {
      serve();
      renderPage(`${PATH}/99`);
      expect(await screen.findByRole('heading', { name: 'Site not found' })).toBeInTheDocument();
    });
  });

  describe('keywords', () => {
    it('shows position, changes (positive = improved), best, URL, SERP features and an inverted sparkline', async () => {
      serve();
      renderPage();

      const row = await findRow('coffee beans johannesburg');
      expect(within(row).getByText('4')).toBeInTheDocument();
      expect(within(row).getByRole('img', { name: 'Position up 2 since the previous check' })).toHaveAttribute('data-tone', 'good');
      expect(within(row).getByRole('img', { name: 'Position up 5 over 7 days' })).toHaveAttribute('data-tone', 'good');
      expect(within(row).getByRole('img', { name: 'Position down 3 over 30 days' })).toHaveAttribute('data-tone', 'bad');
      expect(within(row).getByRole('link', { name: /\/shop/ })).toHaveAttribute('href', 'https://www.karoocoffee.co.za/shop');
      expect(within(row).getByRole('img', { name: 'Featured snippet: you appear in it' })).toHaveAttribute('data-ours', 'true');
      expect(within(row).getByRole('img', { name: "Map pack: shown, you're not in it" })).toHaveAttribute('data-ours', 'false');
      expect(within(row).queryByRole('img', { name: /AI overview/ })).not.toBeInTheDocument();
      expect(within(row).getByText('Desktop')).toBeInTheDocument();

      // Inverted: the best position (4, the last check) is drawn at the top; the gap breaks the line.
      const spark = within(row).getByTestId('position-sparkline');
      expect(spark).toHaveAccessibleName(/from 9 on .* to 4 on .*; best 4/);
      const d = spark.querySelector('path')?.getAttribute('d') ?? '';
      expect(d.match(/M/g)).toHaveLength(2);
      const ys = [...d.matchAll(/[ML][\d.]+ ([\d.]+)/g)].map((m) => Number(m[1]));
      expect(ys[ys.length - 1]).toBeLessThan(ys[0]);
    });

    it('shows — for a keyword out of the top 100', async () => {
      serve();
      renderPage();

      const row = await findRow('buy espresso machine');
      expect(within(row).getAllByText('Not in the top 100').length).toBeGreaterThan(0);
      expect(within(row).getByText('Mobile')).toBeInTheDocument();
      expect(within(row).getByLabelText('By coordinates')).toBeInTheDocument();
      expect(row).toHaveTextContent('41');
    });

    it('keeps filters and sort in the URL and sends them to the API', async () => {
      serve();
      renderPage();

      await findRow('coffee beans johannesburg');
      await userEvent.click(screen.getByRole('combobox', { name: 'Device' }));
      await userEvent.click(await screen.findByRole('option', { name: 'Mobile' }));
      await waitFor(() => expect(location()).toContain('device=mobile'));

      await userEvent.click(screen.getByRole('combobox', { name: 'Position' }));
      await userEvent.click(await screen.findByRole('option', { name: 'Not ranking' }));
      await waitFor(() => expect(location()).toContain('bucket=not_ranking'));

      await userEvent.click(within(table()).getByRole('button', { name: /7d/ }));
      await waitFor(() => expect(location()).toContain('sort=change_7d'));
      await waitFor(() =>
        expect(api.getKeywords).toHaveBeenLastCalledWith(7, expect.objectContaining({ device: 'mobile', bucket: 'not_ranking', sort: { key: 'change_7d', direction: 'asc' }, page: 1, perPage: 15 })),
      );
    });

    it('reads filters from the URL', async () => {
      serve();
      renderPage(`${PATH}/7?search=beans&location=Johannesburg&tag=shop&sort=position&direction=desc`);

      await findRow('coffee beans johannesburg');
      expect(api.getKeywords).toHaveBeenCalledWith(7, expect.objectContaining({ search: 'beans', location: 'Johannesburg', tag: 'shop', sort: { key: 'position', direction: 'desc' } }));
      expect(screen.getByRole('searchbox', { name: 'Search keywords' })).toHaveValue('beans');
    });

    it('checks a keyword now after confirming, then polls until the result lands and refreshes usage', async () => {
      serve();
      vi.mocked(api.checkKeyword).mockResolvedValue(keyword({ lastCheckStatus: 'pending' }));
      renderPage();

      const row = await findRow('coffee beans johannesburg');
      await waitFor(() => expect(within(row).getByRole('button', { name: /Check now: coffee beans johannesburg/ })).toBeEnabled());
      await userEvent.click(within(row).getByRole('button', { name: /Check now: coffee beans johannesburg/ }));
      const dialog = await screen.findByRole('alertdialog');
      expect(dialog).toHaveTextContent("Check this keyword's position now? You have 17 of 20 instant checks left today.");
      expect(dialog.textContent).not.toMatch(/\$|live mode|price|cost|dataforseo/i);
      const usageCalls = vi.mocked(api.getRankUsage).mock.calls.length;

      vi.mocked(api.getKeywords).mockResolvedValue(page([keyword({ position: 3, lastCheckStatus: 'done' }), NOT_RANKING]));
      await userEvent.click(within(dialog).getByRole('button', { name: 'Check now' }));
      expect(api.checkKeyword).toHaveBeenCalledWith(501);
      await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
      expect((await within(table()).findAllByText('Checking…')).length).toBeGreaterThan(0);

      await waitFor(() => expect(showToaster).toHaveBeenCalledWith('success', '“coffee beans johannesburg” is at position 3.'), { timeout: 6000 });
      expect(within(table()).queryByText('Checking…')).not.toBeInTheDocument();
      expect(vi.mocked(api.getRankUsage).mock.calls.length).toBeGreaterThan(usageCalls);
    });

    it('disables Check now, with the reason, when today’s instant checks are used up', async () => {
      serve({ use: usage({ checksNowToday: 20 }) });
      renderPage();

      const row = await findRow('coffee beans johannesburg');
      await waitFor(() => expect(within(row).getByRole('button', { name: /Check now: coffee beans johannesburg/ })).toBeDisabled());
      expect(within(row).getByTestId('check-now-blocked')).toHaveAccessibleName(/used all 20 instant checks for today/);
      expect(screen.getByRole('region', { name: 'Rank tracking usage' })).toHaveTextContent('Instant checks today20 of 20');
    });

    it('disables Check now and says so calmly while checks are paused', async () => {
      serve({ use: usage({ paused: true }) });
      renderPage();

      const row = await findRow('coffee beans johannesburg');
      await waitFor(() => expect(within(row).getByRole('button', { name: /Check now: coffee beans johannesburg/ })).toBeDisabled());
      expect(within(row).getByTestId('check-now-blocked')).toHaveAccessibleName(/Rank checks are paused for now/);
      expect(screen.getByRole('status', { name: 'Rank checks paused' })).toHaveTextContent('Your keywords are safe and checks resume automatically.');
    });

    it('shows the API’s message when the daily limit is hit (429) and re-reads usage', async () => {
      serve();
      vi.mocked(api.checkKeyword).mockRejectedValue(apiError(429, { message: 'You have used all 20 instant checks for today.', error_type: 'check_limit_reached' }));
      renderPage();

      const row = await findRow('coffee beans johannesburg');
      await waitFor(() => expect(within(row).getByRole('button', { name: /Check now/ })).toBeEnabled());
      const usageCalls = vi.mocked(api.getRankUsage).mock.calls.length;
      vi.mocked(api.getRankUsage).mockResolvedValue(usage({ checksNowToday: 20 }));
      await userEvent.click(within(row).getByRole('button', { name: /Check now/ }));
      await userEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Check now' }));
      await waitFor(() => expect(showToaster).toHaveBeenCalledWith('error', 'You have used all 20 instant checks for today.'));
      await waitFor(() => expect(vi.mocked(api.getRankUsage).mock.calls.length).toBeGreaterThan(usageCalls));
      await waitFor(() => expect(within(row).getByRole('button', { name: /Check now/ })).toBeDisabled());
    });

    it('shows the API’s message when checks were paused meanwhile (409)', async () => {
      serve();
      vi.mocked(api.checkKeyword).mockRejectedValue(apiError(409, { message: 'Rank checks are paused for now.', error_type: 'rank_checks_paused' }));
      renderPage();

      const row = await findRow('coffee beans johannesburg');
      await waitFor(() => expect(within(row).getByRole('button', { name: /Check now/ })).toBeEnabled());
      await userEvent.click(within(row).getByRole('button', { name: /Check now/ }));
      await userEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Check now' }));
      await waitFor(() => expect(showToaster).toHaveBeenCalledWith('default', 'Rank checks are paused for now.'));
    });

    it('says when a check is already running', async () => {
      serve();
      vi.mocked(api.checkKeyword).mockRejectedValue(apiError(409, { message: 'A check is already running.', error_type: 'check_running' }));
      renderPage();

      const row = await findRow('coffee beans johannesburg');
      await userEvent.click(within(row).getByRole('button', { name: /Check now/ }));
      await userEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Check now' }));
      await waitFor(() => expect(showToaster).toHaveBeenCalledWith('default', 'A check is already running.'));
    });

    it('bulk-sets the frequency of selected keywords and deletes after confirming', async () => {
      serve();
      vi.mocked(api.bulkKeywords).mockResolvedValue();
      renderPage();

      await findRow('coffee beans johannesburg');
      await userEvent.click(within(table()).getByRole('checkbox', { name: /Select all keywords/ }));
      expect(screen.getByRole('region', { name: 'Bulk actions' })).toHaveTextContent('2 selected');
      await userEvent.click(screen.getByRole('button', { name: /Set frequency/ }));
      await userEvent.click(await screen.findByRole('menuitem', { name: 'Weekly' }));
      await waitFor(() => expect(api.bulkKeywords).toHaveBeenCalledWith(7, 'set_frequency', [501, 502], 'weekly'));

      await userEvent.click(within(table()).getByRole('checkbox', { name: /Select coffee beans johannesburg/ }));
      await userEvent.click(within(screen.getByRole('region', { name: 'Bulk actions' })).getByRole('button', { name: 'Delete' }));
      const dialog = await screen.findByRole('alertdialog');
      expect(dialog).toHaveTextContent('Delete 1 keyword?');
      await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
      await waitFor(() => expect(api.bulkKeywords).toHaveBeenLastCalledWith(7, 'delete', [501], undefined));
    });

    it('edits a keyword’s frequency, day and tags in a drawer', async () => {
      serve();
      vi.mocked(api.updateKeyword).mockResolvedValue(keyword({ frequency: 'weekly', weeklyDay: 3 }));
      renderPage();

      const row = await findRow('coffee beans johannesburg');
      await userEvent.click(within(row).getByRole('button', { name: /Edit coffee beans johannesburg/ }));
      const drawer = await screen.findByRole('dialog');
      await userEvent.click(within(drawer).getByRole('radio', { name: /Weekly/ }));
      await userEvent.click(within(drawer).getByRole('combobox', { name: 'Day of the week' }));
      await userEvent.click(await screen.findByRole('option', { name: 'Wednesday' }));
      const tags = within(drawer).getByRole('textbox', { name: 'Tags (optional)' });
      await userEvent.clear(tags);
      await userEvent.type(tags, 'shop, gauteng');
      await userEvent.click(within(drawer).getByRole('button', { name: 'Save changes' }));

      await waitFor(() => expect(api.updateKeyword).toHaveBeenCalledWith(501, { frequency: 'weekly', weeklyDay: 3, tags: ['shop', 'gauteng'], isActive: true }));
    });

    it('shows the keyword-limit 422 when resuming a paused keyword', async () => {
      serve({ rows: [keyword({ isActive: false })] });
      vi.mocked(api.updateKeyword).mockRejectedValue(apiError(422, { message: 'Limit.', errors: { is_active: ['This workspace can track up to 500 keywords. You have 0 left.'] } }));
      renderPage();

      await userEvent.click(within(await findRow('coffee beans johannesburg')).getByRole('button', { name: /Edit coffee beans johannesburg/ }));
      const drawer = await screen.findByRole('dialog');
      await userEvent.click(within(drawer).getByRole('switch'));
      await userEvent.click(within(drawer).getByRole('button', { name: 'Save changes' }));
      expect(await within(drawer).findByText('This workspace can track up to 500 keywords. You have 0 left.')).toBeInTheDocument();
    });

    it('sends Sunday as day 0 and leaves the day out for daily checks', async () => {
      serve({ rows: [keyword({ frequency: 'weekly', weeklyDay: 0 })] });
      vi.mocked(api.updateKeyword).mockResolvedValue(keyword());
      renderPage();

      await userEvent.click(within(await findRow('coffee beans johannesburg')).getByRole('button', { name: /Edit coffee beans johannesburg/ }));
      const drawer = await screen.findByRole('dialog');
      expect(within(drawer).getByRole('combobox', { name: 'Day of the week' })).toHaveTextContent('Sunday');
      await userEvent.click(within(drawer).getByRole('radio', { name: /Daily/ }));
      expect(within(drawer).queryByRole('combobox', { name: 'Day of the week' })).not.toBeInTheDocument();
      await userEvent.click(within(drawer).getByRole('button', { name: 'Save changes' }));
      await waitFor(() => expect(api.updateKeyword).toHaveBeenCalledWith(501, { frequency: 'daily', tags: ['shop'], isActive: true }));
    });

    it('opens a keyword’s 90-day history: inverted position chart, ranking URL changes, SERP features', async () => {
      serve();
      renderPage();

      await userEvent.click(within(await findRow('coffee beans johannesburg')).getByRole('button', { name: 'coffee beans johannesburg' }));
      const drawer = await screen.findByRole('dialog');
      expect(await within(drawer).findByTestId('position-history')).toHaveAccessibleName(/now 4, best 4\. 1 checks out of the top 100/);
      expect(api.getKeywordHistory).toHaveBeenCalledWith(501);
      const urls = within(drawer).getByRole('list', { name: 'Ranking URL, newest first' });
      const items = within(urls).getAllByRole('listitem');
      expect(items[0]).toHaveTextContent('/shop');
      expect(items[0]).toHaveTextContent(/Changed/);
      expect(items[1]).toHaveTextContent('/blog/beans');
      expect(within(drawer).getByText('Shown on 3 of 6 checks · you in 1')).toBeInTheDocument();
    });
  });

  describe('permissions', () => {
    it('gives a viewer the data without Add, Check now, edit, selection or delete', async () => {
      permissions.list = VIEWER;
      serve();
      renderPage();

      await findRow('coffee beans johannesburg');
      expect(screen.queryByRole('button', { name: /Add keywords/ })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Check now/ })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Edit / })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Delete / })).not.toBeInTheDocument();
      expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    });
  });

  describe('cannibalisation', () => {
    it('lists keywords with competing pages, best first, with the explainer and fix', async () => {
      serve();
      renderPage(`${PATH}/7?tab=cannibalisation`);

      expect(await screen.findByRole('heading', { name: 'What is keyword cannibalisation?' })).toBeInTheDocument();
      expect(screen.getByText(/pick one page for this search; merge or differentiate the other, and point internal links at the one you keep/)).toBeInTheDocument();
      const pages = (await screen.findAllByRole('list', { name: '2 pages ranking for cold brew coffee' }))[0];
      const items = within(pages).getAllByRole('listitem');
      expect(items[0]).toHaveTextContent('8');
      expect(items[0]).toHaveTextContent('/shop/cold-brew');
      expect(items[1]).toHaveTextContent('14');
      expect(api.getCannibalisation).toHaveBeenCalledWith(7, { page: 1, perPage: 15 });
    });
  });

  describe('add keywords', () => {
    it('counts and dedupes keywords, validates a suburb by coordinates and shows what it adds against the limit', async () => {
      serve();
      vi.mocked(api.addKeywords).mockResolvedValue({ created: 3, skipped: 1 });
      renderPage();

      await userEvent.click(await screen.findByRole('button', { name: 'Add keywords' }));
      const drawer = await screen.findByRole('dialog', { name: 'Add keywords' });
      await userEvent.type(within(drawer).getByRole('textbox', { name: 'Keywords' }), 'coffee beans{enter}Coffee Beans{enter}espresso{enter}');
      expect(within(drawer).getByTestId('keyword-count')).toHaveTextContent('2 keywords · 1 duplicate removed');
      // Default: South Africa, desktop + mobile, weekly: 2 × 1 × 2 = 4.
      expect(within(drawer).getByRole('radio', { name: /Weekly/ })).toBeChecked();
      expect(within(drawer).getByRole('radio', { name: /Daily \(uses 7× more checks\)/ })).not.toBeChecked();
      expect(await within(drawer).findByTestId('keyword-allowance')).toHaveTextContent('This adds 4 keywords (2 × 1 location × 2 devices). You have 320 of 500 left.');
      expect(drawer.textContent).not.toMatch(/\$|cost|dataforseo/i);

      await userEvent.type(within(drawer).getByRole('textbox', { name: 'Name' }), 'Sandton');
      await userEvent.type(within(drawer).getByRole('textbox', { name: 'Latitude, longitude' }), '28.0567');
      await userEvent.click(within(drawer).getByRole('button', { name: 'Add' }));
      expect(await within(drawer).findByText('Use “latitude, longitude” in decimal degrees, e.g. -26.1076, 28.0567.')).toBeInTheDocument();
      const point = within(drawer).getByRole('textbox', { name: 'Latitude, longitude' });
      await userEvent.clear(point);
      await userEvent.type(point, '-26.1076, 28.0567');
      await userEvent.click(within(drawer).getByRole('button', { name: 'Add' }));
      expect(within(within(drawer).getByRole('list', { name: 'Chosen locations' })).getByText('-26.1076,28.0567')).toBeInTheDocument();

      await userEvent.click(within(drawer).getByRole('radio', { name: /Daily/ }));
      await userEvent.click(within(drawer).getByRole('checkbox', { name: /Mobile/ }));
      // 2 × 2 × 1 = 4.
      expect(within(drawer).getByTestId('keyword-allowance')).toHaveTextContent('This adds 4 keywords (2 × 2 locations × 1 device). You have 320 of 500 left.');

      await userEvent.click(within(drawer).getByRole('button', { name: 'Add 2 keywords' }));
      await waitFor(() =>
        expect(api.addKeywords).toHaveBeenCalledWith(7, {
          keywords: ['coffee beans', 'espresso'],
          locations: [
            { type: 'code', code: 2710, name: 'South Africa' },
            { type: 'coordinate', coordinate: '-26.1076,28.0567', name: 'Sandton' },
          ],
          devices: ['desktop'],
          frequency: 'daily',
        }),
      );
      expect(showToaster).toHaveBeenCalledWith('success', 'Added 3, skipped 1 already tracked.');
      await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Add keywords' })).not.toBeInTheDocument());
    });

    it('warns and disables Add when the keywords would not fit in what is left', async () => {
      serve({ use: usage({ keywordsTracked: 495 }) });
      renderPage();

      await userEvent.click(await screen.findByRole('button', { name: 'Add keywords' }));
      const drawer = await screen.findByRole('dialog', { name: 'Add keywords' });
      await userEvent.type(within(drawer).getByRole('textbox', { name: 'Keywords' }), 'a{enter}b{enter}c{enter}');
      // 3 × 1 × 2 = 6 > 5 left.
      const allowance = within(drawer).getByTestId('keyword-allowance');
      expect(allowance).toHaveTextContent('This adds 6 keywords (3 × 1 location × 2 devices). You have 5 of 500 left.');
      expect(allowance).toHaveAttribute('data-over', 'true');
      expect(allowance).toHaveAttribute('role', 'alert');
      expect(within(drawer).getByRole('button', { name: 'Add 3 keywords' })).toBeDisabled();

      // Desktop only: 3 × 1 × 1 = 3 fits.
      await userEvent.click(within(drawer).getByRole('checkbox', { name: /Mobile/ }));
      expect(allowance).toHaveTextContent('This adds 3 keywords (3 × 1 location × 1 device). You have 5 of 500 left.');
      expect(allowance).not.toHaveAttribute('data-over');
      expect(within(drawer).getByRole('button', { name: 'Add 3 keywords' })).toBeEnabled();
    });

    it('binds the API’s keyword-limit 422 to the keywords field', async () => {
      serve();
      vi.mocked(api.addKeywords).mockRejectedValue(apiError(422, { message: 'Too many.', errors: { keywords: ['This would add 4 keywords; you have 2 of 500 left.'] } }));
      renderPage();

      await userEvent.click(await screen.findByRole('button', { name: 'Add keywords' }));
      const drawer = await screen.findByRole('dialog', { name: 'Add keywords' });
      await userEvent.type(within(drawer).getByRole('textbox', { name: 'Keywords' }), 'a{enter}b{enter}');
      await userEvent.click(within(drawer).getByRole('button', { name: 'Add 2 keywords' }));
      expect(await within(drawer).findByText('This would add 4 keywords; you have 2 of 500 left.')).toBeInTheDocument();
      expect(within(drawer).getByRole('textbox', { name: 'Keywords' })).toHaveAttribute('aria-invalid', 'true');
    });

    it('needs keywords, a location and a device', async () => {
      serve();
      renderPage();

      await userEvent.click(await screen.findByRole('button', { name: 'Add keywords' }));
      const drawer = await screen.findByRole('dialog', { name: 'Add keywords' });
      await userEvent.click(within(drawer).getByRole('button', { name: 'Remove South Africa' }));
      await userEvent.click(within(drawer).getByRole('checkbox', { name: /Desktop/ }));
      await userEvent.click(within(drawer).getByRole('checkbox', { name: /Mobile/ }));
      await userEvent.click(within(drawer).getByRole('button', { name: 'Add keywords' }));

      expect(await within(drawer).findByText('Enter at least one keyword, one per line.')).toBeInTheDocument();
      expect(within(drawer).getByText('Choose at least one location.')).toBeInTheDocument();
      expect(within(drawer).getByText('Choose desktop, mobile or both.')).toBeInTheDocument();
      expect(api.addKeywords).not.toHaveBeenCalled();
    });
  });
});
