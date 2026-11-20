import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { apiError, renderAt } from '@/test/renderWithProviders';
import showToaster from '@/utils/showToaster';
import * as api from '../api/rankTrackingApi';
import * as competitorsApi from '../api/competitorsApi';
import { ALERT, COMPETITORS, H2H_WINNING, NOT_RANKING, SUGGESTIONS, competitor, h2hRow, keyword, overview, page, rankSite, summary, usage } from '../test/fixtures';
import type { Competitor } from '../types';
import RankTrackingSitePage from './RankTrackingSitePage';

vi.mock('../api/rankTrackingApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/rankTrackingApi')>();
  return Object.fromEntries(Object.entries(actual).map(([k, v]) => [k, typeof v === 'function' && k !== 'tidyDigitKeys' && k !== 'toApiSort' ? vi.fn() : v]));
});
vi.mock('../api/competitorsApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/competitorsApi')>();
  return Object.fromEntries(Object.entries(actual).map(([k, v]) => [k, typeof v === 'function' ? vi.fn() : v]));
});
vi.mock('@/utils/showToaster', () => ({ default: vi.fn() }));

const permissions = vi.hoisted(() => ({ list: [] as string[] }));
vi.mock('@/contexts/PermissionContextType', () => ({
  usePermissions: () => ({ hasPermission: (p: string) => permissions.list.includes(p) }),
}));

const MANAGER = ['view_rank_tracking', 'update_rank_tracking'];
const VIEWER = ['view_rank_tracking'];

const PATH = '/dashboard/rank-tracking';
const renderPage = (search = '?tab=competitors') => renderAt(`${PATH}/7${search}`, [{ path: `${PATH}/:siteId`, element: <RankTrackingSitePage /> }]);
const location = () => screen.getByTestId('location').textContent ?? '';
const h2hTable = () => within(screen.getByRole('region', { name: 'Head-to-head' })).getByRole('table');

function serve({ competitors = COMPETITORS, recipients = ['am@agency.co.za', 'seo@agency.co.za'] }: { competitors?: Competitor[]; recipients?: string[] } = {}) {
  vi.mocked(api.getRankSites).mockResolvedValue([rankSite()]);
  vi.mocked(api.getRankUsage).mockResolvedValue(usage());
  vi.mocked(api.getRankSummary).mockResolvedValue(summary());
  vi.mocked(api.getKeywords).mockResolvedValue(page([keyword(), NOT_RANKING]));
  vi.mocked(competitorsApi.getCompetitors).mockResolvedValue(competitors);
  vi.mocked(competitorsApi.getCompetitorSuggestions).mockResolvedValue(SUGGESTIONS);
  vi.mocked(competitorsApi.getCompetitorOverview).mockResolvedValue(overview());
  vi.mocked(competitorsApi.getHeadToHead).mockResolvedValue(page([h2hRow(), H2H_WINNING]));
  vi.mocked(competitorsApi.getCompetitorAlerts).mockResolvedValue(page([ALERT]));
  vi.mocked(competitorsApi.getCompetitorSettings).mockResolvedValue({ alertRecipients: recipients });
}

describe('Rank tracking › Competitors', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    permissions.list = MANAGER;
  });

  it('opens from its tab, kept in the URL', async () => {
    serve();
    renderPage('');

    await userEvent.click(await screen.findByRole('tab', { name: 'Competitors' }));
    await waitFor(() => expect(location()).toBe(`${PATH}/7?tab=competitors`));
    expect(await screen.findByRole('region', { name: 'Share of voice' })).toBeInTheDocument();
    expect(competitorsApi.getCompetitors).toHaveBeenCalledWith(7);
  });

  describe('empty state', () => {
    it('explains, offers Add competitor and adds a suggestion in one click', async () => {
      serve({ competitors: [] });
      vi.mocked(competitorsApi.addCompetitor).mockResolvedValue(competitor({ id: 20, domain: 'coffeemag.co.za', name: 'coffeemag.co.za' }));
      renderPage();

      expect(await screen.findByRole('heading', { name: 'See how you stack up against competitors' })).toBeInTheDocument();
      const suggestions = await screen.findByRole('list', { name: 'Suggested competitors' });
      expect(within(suggestions).getByText('coffeemag.co.za').closest('li')).toHaveTextContent('Seen in the top 10 for 7 of your 24 keywords · best #2');
      await userEvent.click(within(suggestions).getByRole('button', { name: 'Add coffeemag.co.za' }));
      await waitFor(() => expect(competitorsApi.addCompetitor).toHaveBeenCalledWith(7, { domain: 'coffeemag.co.za' }));
      expect(showToaster).toHaveBeenCalledWith('success', expect.stringContaining('coffeemag.co.za added'));
      expect(competitorsApi.getCompetitorOverview).not.toHaveBeenCalled();
    });

    it('says when there are no suggestions yet', async () => {
      serve({ competitors: [] });
      vi.mocked(competitorsApi.getCompetitorSuggestions).mockResolvedValue([]);
      renderPage();

      expect(await screen.findByText(/Suggestions appear after the next check of your keywords/)).toBeInTheDocument();
    });

    it('tells a viewer to ask for competitors, without Add or suggestions', async () => {
      permissions.list = VIEWER;
      serve({ competitors: [] });
      renderPage();

      expect(await screen.findByText(/Ask your account manager to add some/)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Add competitor/ })).not.toBeInTheDocument();
      expect(competitorsApi.getCompetitorSuggestions).not.toHaveBeenCalled();
    });
  });

  describe('add competitor drawer', () => {
    it('normalises a URL to its domain, shows the limit and sends the optional name', async () => {
      serve();
      vi.mocked(competitorsApi.addCompetitor).mockResolvedValue(competitor({ id: 20, domain: 'coffeemag.co.za', name: 'Coffee Mag' }));
      renderPage();

      await userEvent.click(await screen.findByRole('button', { name: 'Add competitor' }));
      const drawer = await screen.findByRole('dialog', { name: 'Add competitor' });
      expect(within(drawer).getByTestId('competitor-limit')).toHaveTextContent('2 of 5 active competitors on this site.');
      expect(drawer.querySelector('[data-slot="sheet-footer"]')).not.toBeNull();

      await userEvent.type(within(drawer).getByRole('textbox', { name: 'Domain or URL' }), 'https://www.CoffeeMag.co.za/reviews');
      expect(within(drawer).getByText('We’ll track coffeemag.co.za and its subdomains.')).toBeInTheDocument();
      await userEvent.type(within(drawer).getByRole('textbox', { name: 'Name (optional)' }), 'Coffee Mag');
      await userEvent.click(within(drawer).getByRole('button', { name: 'Add competitor' }));

      await waitFor(() => expect(competitorsApi.addCompetitor).toHaveBeenCalledWith(7, { domain: 'coffeemag.co.za', name: 'Coffee Mag' }));
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });

    it('refuses an invalid domain, the site’s own and an existing competitor; binds the API’s 422', async () => {
      serve();
      vi.mocked(competitorsApi.addCompetitor).mockRejectedValue(apiError(422, { message: 'Invalid.', errors: { domain: ['This site already has 5 active competitors.'] } }));
      renderPage();

      await userEvent.click(await screen.findByRole('button', { name: 'Add competitor' }));
      const drawer = await screen.findByRole('dialog', { name: 'Add competitor' });
      const input = within(drawer).getByRole('textbox', { name: 'Domain or URL' });
      const submit = within(drawer).getByRole('button', { name: 'Add competitor' });

      await userEvent.type(input, 'not a domain');
      await userEvent.click(submit);
      expect(await within(drawer).findByText('Enter a domain like beanthere.co.za or a link to their site.')).toBeInTheDocument();

      await userEvent.clear(input);
      await userEvent.type(input, 'shop.karoocoffee.co.za');
      await userEvent.click(submit);
      expect(await within(drawer).findByText('That’s this site’s own domain. Add another business’s site.')).toBeInTheDocument();

      await userEvent.clear(input);
      await userEvent.type(input, 'www.beanthere.co.za');
      await userEvent.click(submit);
      expect(await within(drawer).findByText('beanthere.co.za is already a competitor of this site.')).toBeInTheDocument();
      expect(competitorsApi.addCompetitor).not.toHaveBeenCalled();

      await userEvent.clear(input);
      await userEvent.type(input, 'coffeemag.co.za');
      await userEvent.click(submit);
      expect(await within(drawer).findByText('This site already has 5 active competitors.')).toBeInTheDocument();
    });

    it('fills the domain from a suggestion, leaving out existing competitors', async () => {
      serve();
      vi.mocked(competitorsApi.getCompetitorSuggestions).mockResolvedValue([...SUGGESTIONS, { domain: 'beanthere.co.za', top10Keywords: 9, keywordsSeen: 18, bestPosition: 1 }]);
      renderPage();

      await userEvent.click(await screen.findByRole('button', { name: 'Add competitor' }));
      const drawer = await screen.findByRole('dialog', { name: 'Add competitor' });
      const list = await within(drawer).findByRole('list', { name: 'Suggested competitors' });
      expect(within(list).queryByText('beanthere.co.za')).not.toBeInTheDocument();
      await userEvent.click(within(list).getByRole('button', { name: 'Use takealot.com' }));
      expect(within(drawer).getByRole('textbox', { name: 'Domain or URL' })).toHaveValue('takealot.com');
    });

    it('disables Add competitor at five active competitors', async () => {
      serve({ competitors: [11, 12, 13, 14, 15].map((id) => competitor({ id, domain: `c${id}.co.za`, name: `c${id}.co.za` })) });
      renderPage();

      expect(await screen.findByText(/active competitors, tracked/)).toHaveTextContent('5 of 5 active competitors');
      expect(screen.getByRole('button', { name: 'Add competitor' })).toBeDisabled();
    });
  });

  describe('share of voice', () => {
    it('shows the site first and competitors in a fixed order, with a legend, a table view and the history start', async () => {
      serve();
      renderPage();

      const card = await screen.findByRole('region', { name: 'Share of voice' });
      const bar = within(card).getByTestId('sov-bar');
      const segments = [...bar.querySelectorAll('[data-series]')];
      expect(segments.map((s) => s.getAttribute('data-series'))).toEqual(['site', 'c11', 'c12']);
      expect((segments[0] as HTMLElement).style.background).toBe('var(--chart-current)');
      expect((segments[1] as HTMLElement).style.background).toBe('var(--series-2)');
      expect(segments[0]).toHaveTextContent('50%');

      const legend = within(card).getByRole('list', { name: 'Share of voice by domain' });
      const items = within(legend).getAllByRole('listitem');
      expect(items[0]).toHaveTextContent('You · karoocoffee.co.za15 in top 1050%');
      expect(items[1]).toHaveTextContent('Bean There9 in top 1030%');

      await userEvent.hover(segments[1]);
      expect(within(card).getByRole('tooltip')).toHaveTextContent('Bean ThereShare of voice30%In the top 109 keywords');

      await userEvent.click(within(card).getByRole('button', { name: 'Table' }));
      const rows = within(within(card).getByRole('table', { name: 'Share of voice' })).getAllByRole('row');
      expect(rows[1]).toHaveTextContent('You · karoocoffee.co.za515218.450%');
      expect(rows[3]).toHaveTextContent('truthcoffee.com');

      expect(screen.getByTestId('history-since')).toHaveTextContent('Competitor history starts on 27/10/2026');
    });

    it('has a weekly trend with every domain in a table view', async () => {
      serve();
      renderPage();

      const trend = await screen.findByRole('region', { name: 'Share of voice by week' });
      expect(within(trend).getByRole('list', { name: 'Lines' })).toHaveTextContent('YouBean Theretruthcoffee.com');
      await userEvent.click(within(trend).getByRole('button', { name: 'Table' }));
      const rows = within(within(trend).getByRole('table', { name: 'Share of voice by week' })).getAllByRole('row');
      expect(rows[0]).toHaveTextContent('Week ofYouBean Theretruthcoffee.com');
      // Newest first.
      expect(rows[1]).toHaveTextContent('16/11/202650%31%19%');
    });
  });

  describe('competitors table', () => {
    it('lists standing, marks paused ones, and renames, pauses and removes from the row menu', async () => {
      serve();
      vi.mocked(competitorsApi.updateCompetitor).mockImplementation(async (id, update) => competitor({ id, ...update }));
      vi.mocked(competitorsApi.deleteCompetitor).mockResolvedValue();
      renderPage();

      const section = await screen.findByRole('region', { name: 'Competitors' });
      const table = within(section).getByRole('table');
      const bean = within(table).getByText('Bean There').closest('tr') as HTMLElement;
      expect(bean).toHaveTextContent('beanthere.co.za');
      expect(bean).toHaveTextContent('4918');
      expect(bean).toHaveTextContent('30%');
      expect(within(table).getByText('Origin').closest('tr')).toHaveTextContent('Paused');

      await userEvent.click(within(bean).getByRole('button', { name: 'Actions for Bean There' }));
      await userEvent.click(await screen.findByRole('menuitem', { name: 'Rename' }));
      const drawer = await screen.findByRole('dialog', { name: 'Rename beanthere.co.za' });
      const name = within(drawer).getByRole('textbox', { name: 'Name' });
      expect(name).toHaveValue('Bean There');
      await userEvent.clear(name);
      await userEvent.type(name, 'Bean There Coffee');
      await userEvent.click(within(drawer).getByRole('button', { name: 'Save name' }));
      await waitFor(() => expect(competitorsApi.updateCompetitor).toHaveBeenCalledWith(11, { name: 'Bean There Coffee' }));
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

      await userEvent.click(within(bean).getByRole('button', { name: 'Actions for Bean There' }));
      await userEvent.click(await screen.findByRole('menuitem', { name: 'Pause' }));
      await waitFor(() => expect(competitorsApi.updateCompetitor).toHaveBeenLastCalledWith(11, { isActive: false }));

      const origin = within(table).getByText('Origin').closest('tr') as HTMLElement;
      await userEvent.click(within(origin).getByRole('button', { name: 'Actions for Origin' }));
      await userEvent.click(await screen.findByRole('menuitem', { name: 'Remove' }));
      const confirm = await screen.findByRole('alertdialog');
      expect(confirm).toHaveTextContent('Origin (origincoffee.co.za) leaves share of voice');
      await userEvent.click(within(confirm).getByRole('button', { name: 'Remove' }));
      await waitFor(() => expect(competitorsApi.deleteCompetitor).toHaveBeenCalledWith(13));
    });

    it('shows the API’s message when resuming would pass the limit', async () => {
      serve();
      vi.mocked(competitorsApi.updateCompetitor).mockRejectedValue(apiError(422, { message: 'This site already has 5 active competitors.', errors: { is_active: ['…'] } }));
      renderPage();

      const section = await screen.findByRole('region', { name: 'Competitors' });
      await userEvent.click(within(section).getAllByRole('button', { name: 'Actions for Origin' })[0]);
      await userEvent.click(await screen.findByRole('menuitem', { name: 'Resume' }));
      await waitFor(() => expect(showToaster).toHaveBeenCalledWith('error', 'This site already has 5 active competitors.'));
    });

    it('gives a viewer the figures without the row menu or Add', async () => {
      permissions.list = VIEWER;
      serve();
      renderPage();

      await screen.findByRole('region', { name: 'Competitors' });
      expect(screen.queryByRole('button', { name: /Actions for/ })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Add competitor' })).not.toBeInTheDocument();
      expect(within(screen.getByRole('region', { name: 'Overtake alerts' })).queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    });
  });

  describe('head-to-head', () => {
    it('shows each position with its change, tints competitors ahead and shows the gap', async () => {
      serve();
      renderPage();

      await waitFor(() => expect(within(h2hTable()).getAllByRole('row')).toHaveLength(3));
      const head = within(h2hTable()).getAllByRole('columnheader').map((h) => h.textContent);
      expect(head).toEqual(['Keyword', 'You', 'Bean There', 'truthcoffee.com', 'Gap']);

      const losing = within(h2hTable()).getByText('coffee beans johannesburg').closest('tr') as HTMLElement;
      expect(within(losing).getByRole('img', { name: 'Key keyword' })).toBeInTheDocument();
      const cells = within(losing).getAllByRole('cell');
      expect(cells[2].querySelector('[data-ahead="true"]')).not.toBeNull();
      expect(cells[2]).toHaveTextContent('ahead of you');
      expect(cells[3].querySelector('[data-ahead="true"]')).toBeNull();
      expect(within(cells[1]).getByRole('img', { name: 'Position up 2 since the previous check' })).toBeInTheDocument();
      expect(cells[4]).toHaveTextContent('−2 (behind)');

      const winning = within(h2hTable()).getByText('buy espresso machine').closest('tr') as HTMLElement;
      expect(within(winning).getAllByRole('cell')[4]).toHaveTextContent('+5 (you lead)');
      expect(within(winning).getAllByRole('cell')[2]).toHaveTextContent('Not in the top 100');
    });

    it('filters and sorts through the URL and the API', async () => {
      serve();
      renderPage();

      await waitFor(() => expect(within(h2hTable()).getAllByRole('row')).toHaveLength(3));
      await userEvent.click(within(screen.getByRole('group', { name: 'Show' })).getByRole('button', { name: 'Losing' }));
      await waitFor(() => expect(location()).toContain('only=losing'));
      await userEvent.click(within(h2hTable()).getByRole('button', { name: /Gap/ }));
      await waitFor(() => expect(location()).toContain('sort=gap'));
      await waitFor(() => expect(competitorsApi.getHeadToHead).toHaveBeenLastCalledWith(7, expect.objectContaining({ only: 'losing', sort: { key: 'gap', direction: 'asc' }, page: 1, perPage: 15 })));
    });

    it('reads its filters from the URL', async () => {
      serve();
      renderPage('?tab=competitors&only=key&search=beans&sort=position&direction=desc');

      await waitFor(() => expect(competitorsApi.getHeadToHead).toHaveBeenCalledWith(7, expect.objectContaining({ only: 'key', search: 'beans', sort: { key: 'position', direction: 'desc' } })));
      expect(await screen.findByRole('searchbox', { name: 'Search head-to-head keywords' })).toHaveValue('beans');
    });
  });

  describe('alerts', () => {
    it('lists overtakes with who gets the emails, and edits the recipients in a drawer', async () => {
      serve();
      vi.mocked(competitorsApi.updateCompetitorSettings).mockImplementation(async (_, s) => s);
      renderPage();

      const alerts = await screen.findByRole('region', { name: 'Overtake alerts' });
      expect(await within(alerts).findByTestId('alert-emails')).toHaveTextContent('Alert emails: 2 recipients');
      const row = (await within(alerts).findByText('coffee beans johannesburg', { selector: 'td span' })).closest('tr') as HTMLElement;
      expect(row).toHaveTextContent('19/11/2026');
      expect(row).toHaveTextContent('Bean There');
      expect(row).toHaveTextContent('Before:6vs your3Now:2vs your4');
      expect(row).toHaveTextContent('Sent 20/11/2026');

      await userEvent.click(within(alerts).getByRole('button', { name: 'Edit' }));
      const drawer = await screen.findByRole('dialog', { name: 'Alert emails' });
      expect(within(drawer).getByRole('list', { name: 'Recipients: 2 added' })).toBeInTheDocument();
      await userEvent.click(within(drawer).getByRole('button', { name: 'Remove seo@agency.co.za' }));
      await userEvent.type(within(drawer).getByLabelText('Recipients'), 'md@agency.co.za{Enter}');
      await userEvent.click(within(drawer).getByRole('button', { name: 'Save' }));

      await waitFor(() => expect(competitorsApi.updateCompetitorSettings).toHaveBeenCalledWith(7, { alertRecipients: ['am@agency.co.za', 'md@agency.co.za'] }));
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });

    it('says when emails are off, and nudges to mark key keywords', async () => {
      serve({ recipients: [] });
      vi.mocked(competitorsApi.getCompetitorOverview).mockResolvedValue(overview({ keyKeywords: 0 }));
      vi.mocked(competitorsApi.getCompetitorAlerts).mockResolvedValue(page([]));
      renderPage();

      const alerts = await screen.findByRole('region', { name: 'Overtake alerts' });
      expect(await within(alerts).findByTestId('alert-emails')).toHaveTextContent('Alert emails: off');
      expect(await within(alerts).findByText(/Alerts only watch key keywords/)).toBeInTheDocument();
      expect(within(alerts).getByText('No competitor has overtaken you on a key keyword yet.')).toBeInTheDocument();
    });
  });

  it('never shows money', async () => {
    serve();
    renderPage();

    await screen.findByRole('region', { name: 'Share of voice' });
    await screen.findByTestId('alert-emails');
    expect(screen.getByRole('tabpanel').textContent).not.toMatch(/\$|\bR\s?\d|ZAR|USD|\bcost|\bprice/i);
  });
});
