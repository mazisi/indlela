import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderAt } from '@/test/renderWithProviders';
import * as api from '../api/rankTrackingApi';
import { rankSite, usage } from '../test/fixtures';
import RankTrackingPage from './RankTrackingPage';

vi.mock('../api/rankTrackingApi');

const PATH = '/dashboard/rank-tracking';
const renderPage = () => renderAt(PATH, [{ path: PATH, element: <RankTrackingPage /> }, { path: `${PATH}/:siteId`, element: <p>Site page</p> }]);
const table = () => screen.getAllByRole('table')[0];

describe('RankTrackingPage (overview)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.getRankUsage).mockResolvedValue(usage());
  });

  it('lists each site with keywords, positions, weekly change and last check, without any cost', async () => {
    vi.mocked(api.getRankSites).mockResolvedValue([
      rankSite(),
      rankSite({ id: 8, name: 'Joburg Hire', client: { id: 2, name: 'Joburg Hire (Pty) Ltd' }, keywordsCount: 0, avgPosition: null, top3: 0, top10: 0, change7dAvg: null, lastCheckedOn: null }),
      rankSite({ id: 9, name: 'Durban Dental', client: { id: 3, name: 'Durban Dental' }, change7dAvg: -2.4, lastCheckedOn: null }),
    ]);
    renderPage();

    await screen.findAllByText('Karoo Coffee');
    const rows = within(table()).getAllByRole('row');
    // Sorted by client, then site.
    expect(rows[1]).toHaveTextContent('Durban Dental');
    expect(rows[2]).toHaveTextContent('Joburg Hire');
    expect(rows[3]).toHaveTextContent('Karoo Coffee');

    const karoo = rows[3];
    expect(karoo).toHaveTextContent('24');
    expect(karoo).toHaveTextContent('8.4');
    expect(karoo).toHaveTextContent('19/11/2026');
    // No cost column, no money anywhere in the table.
    const headers = within(table()).getAllByRole('columnheader').map((h) => h.textContent);
    expect(headers.join(' ')).not.toMatch(/cost|\$/i);
    expect(table()).not.toHaveTextContent('$');
    // Positive = improved: green, up.
    const up = within(karoo).getByRole('img', { name: 'Position up 2 average over 7 days' });
    expect(up).toHaveAttribute('data-tone', 'good');
    const down = within(rows[1]).getByRole('img', { name: 'Position down 2 average over 7 days' });
    expect(down).toHaveAttribute('data-tone', 'bad');
    expect(rows[1]).toHaveTextContent('Not checked yet');
    expect(rows[2]).toHaveTextContent('No keywords');

    // Usage strip.
    const strip = screen.getByRole('region', { name: 'Rank tracking usage' });
    expect(within(strip).getByTestId('keywords-tracked')).toHaveTextContent('180 of 500');
    expect(within(strip).getByTestId('checks-today')).toHaveTextContent('3 of 20');
  });

  it('opens a site from its row', async () => {
    vi.mocked(api.getRankSites).mockResolvedValue([rankSite()]);
    renderPage();

    await screen.findAllByText('Karoo Coffee');
    await userEvent.click(within(table()).getByRole('button', { name: /Karoo Coffee/ }));
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(`${PATH}/7`));
  });

  describe('usage strip', () => {
    const MONEY = /\$|cost|balance|sandbox|dataforseo|credential|\.env|top up/i;
    const renderUsage = async (over: Parameters<typeof usage>[0]) => {
      vi.mocked(api.getRankSites).mockResolvedValue([rankSite()]);
      vi.mocked(api.getRankUsage).mockResolvedValue(usage(over));
      renderPage();
      return screen.findByRole('region', { name: 'Rank tracking usage' });
    };
    const keywordBar = (strip: HTMLElement) => within(strip).getByRole('progressbar', { name: 'Keywords tracked' });

    it('shows keywords against the limit and instant checks today, with no money text', async () => {
      const strip = await renderUsage({});
      expect(within(strip).getByTestId('keywords-tracked')).toHaveTextContent('180 of 500');
      expect(keywordBar(strip)).toHaveAttribute('data-level', 'ok');
      expect(keywordBar(strip)).toHaveAttribute('aria-valuenow', '180');
      expect(strip).toHaveTextContent('320 left to add.');
      expect(within(strip).getByTestId('checks-today')).toHaveTextContent('3 of 20');
      expect(screen.queryByRole('status', { name: 'Rank checks paused' })).not.toBeInTheDocument();
      expect(document.body.textContent).not.toMatch(MONEY);
    });

    it('turns amber from 80 %', async () => {
      const strip = await renderUsage({ keywordsTracked: 400 });
      expect(keywordBar(strip)).toHaveAttribute('data-level', 'near');
      expect(strip).toHaveTextContent('Nearly there: 100 left.');
      expect(document.body.textContent).not.toMatch(MONEY);
    });

    it('turns red at the limit', async () => {
      const strip = await renderUsage({ keywordsTracked: 500, checksNowToday: 20 });
      expect(keywordBar(strip)).toHaveAttribute('data-level', 'full');
      expect(within(strip).getByRole('progressbar', { name: 'Instant checks today' })).toHaveAttribute('data-level', 'full');
      expect(strip).toHaveTextContent('Limit reached');
      expect(document.body.textContent).not.toMatch(MONEY);
    });

    it('says calmly when checks are paused', async () => {
      await renderUsage({ paused: true });
      const notice = screen.getByRole('status', { name: 'Rank checks paused' });
      expect(notice).toHaveTextContent('Rank checks are paused for now. Your keywords are safe and checks resume automatically.');
      expect(document.body.textContent).not.toMatch(MONEY);
      // The sites still list.
      expect((await screen.findAllByText('Karoo Coffee')).length).toBeGreaterThan(0);
    });
  });

  it('points to Sites when there are none', async () => {
    vi.mocked(api.getRankSites).mockResolvedValue([]);
    renderPage();

    expect(await screen.findByRole('heading', { name: 'No sites to track yet' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to Sites' })).toHaveAttribute('href', '/dashboard/clients/sites');
  });

  it('filters sites by search', async () => {
    vi.mocked(api.getRankSites).mockResolvedValue([rankSite(), rankSite({ id: 9, name: 'Durban Dental', client: { id: 3, name: 'Durban Dental' } })]);
    renderPage();

    await screen.findAllByText('Karoo Coffee');
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search sites or clients' }), 'durban');
    expect(within(table()).queryByText('Karoo Coffee')).not.toBeInTheDocument();
    expect(within(table()).getByText('Durban Dental')).toBeInTheDocument();
  });
});
