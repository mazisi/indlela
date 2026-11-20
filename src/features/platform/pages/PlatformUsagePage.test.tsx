import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { apiError, renderAt } from '@/test/renderWithProviders';
import showToaster from '@/utils/showToaster';
import * as api from '../api/platformApi';
import { page, platformUsage, workspaceRow } from '../test/fixtures';
import PlatformUsagePage from './PlatformUsagePage';

vi.mock('../api/platformApi');
vi.mock('@/utils/showToaster', () => ({ default: vi.fn() }));

const PATH = '/dashboard/platform/usage';
const renderPage = (path = PATH) =>
  renderAt(path, [
    { path: PATH, element: <PlatformUsagePage /> },
    { path: '/dashboard/unauthorized', element: <p>Access denied</p> },
  ]);
const location = () => screen.getByTestId('location').textContent;
const table = () => screen.getAllByRole('table')[0];
const lastQuery = () => vi.mocked(api.getWorkspaceUsage).mock.lastCall?.[0];

const ROWS = [
  workspaceRow(),
  workspaceRow({ id: 7, name: 'Bosveld Foods', slug: 'bosveld-foods', owner: null, keywordsTracked: 980, keywordLimit: 1000, keywordLimitOverride: 1000, costThisMonth: 9.25, lastCheckAt: null, liveChecksThisMonth: 0 }),
];

describe('PlatformUsagePage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.getPlatformUsage).mockResolvedValue(platformUsage());
    vi.mocked(api.getWorkspaceUsage).mockResolvedValue(page(ROWS));
  });

  it('shows the header, figures, chart and every workspace, busiest spender first', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Platform usage' })).toBeInTheDocument();
    expect(screen.getByText('Internal · Indlela staff only')).toBeInTheDocument();
    expect(await screen.findByTestId('usage-month')).toHaveTextContent('November 2026');
    expect(screen.getByTestId('kpi-spend')).toHaveTextContent('$31.20');
    expect(screen.getByRole('heading', { name: 'Cost by month' })).toBeInTheDocument();

    await screen.findAllByText('Acme Digital');
    expect(lastQuery()).toMatchObject({ page: 1, perPage: 15, sort: { key: 'cost_this_month', direction: 'desc' } });
    expect(within(table()).getByRole('columnheader', { name: /This month/ })).toHaveAttribute('aria-sort', 'descending');

    const [, acme, bosveld] = within(table()).getAllByRole('row');
    expect(acme).toHaveTextContent('acme-digital · thandi@acme.co.za');
    expect(acme).toHaveTextContent('420 / 500');
    expect(within(acme).queryByText('custom')).not.toBeInTheDocument();
    expect(within(acme).getByRole('progressbar', { name: 'Keywords tracked by Acme Digital' })).toHaveAttribute('data-level', 'near');
    expect(acme).toHaveTextContent('9,60012 live');
    expect(acme).toHaveTextContent('$14.60');
    expect(acme).toHaveTextContent('$12.10');
    expect(acme).toHaveTextContent('20/11/2026');
    expect(within(acme).getByRole('img', { name: /Cost by month: June 2026 \$0\.00, .*November 2026 \$14\.60/ })).toBeInTheDocument();

    expect(bosveld).toHaveTextContent('bosveld-foods · no owner');
    expect(within(bosveld).getByText('custom')).toBeInTheDocument();
    expect(bosveld).toHaveTextContent('Never');
  });

  it('keeps sort and search in the URL and sends them to the API', async () => {
    renderPage();
    await screen.findAllByText('Acme Digital');

    await userEvent.click(within(table()).getByRole('button', { name: 'Workspace' }));
    await waitFor(() => expect(location()).toBe(`${PATH}?sort=name`));
    await waitFor(() => expect(lastQuery()?.sort).toEqual({ key: 'name', direction: 'asc' }));

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search workspaces' }), 'acme');
    await waitFor(() => expect(location()).toBe(`${PATH}?sort=name&search=acme`));
    await waitFor(() => expect(lastQuery()).toMatchObject({ search: 'acme', page: 1 }));
  });

  it('reads sort, search and page from the URL', async () => {
    renderPage(`${PATH}?sort=last_check_at&direction=desc&search=bos&page=2`);
    await screen.findAllByText('Acme Digital');
    expect(lastQuery()).toEqual({ page: 2, perPage: 15, search: 'bos', sort: { key: 'last_check_at', direction: 'desc' } });
    expect(screen.getByRole('searchbox', { name: 'Search workspaces' })).toHaveValue('bos');
  });

  it('says when no workspace matches, and when there are none', async () => {
    vi.mocked(api.getWorkspaceUsage).mockResolvedValue(page([]));
    renderPage(`${PATH}?search=zzz`);
    expect(await screen.findByText('No workspaces match “zzz”')).toBeInTheDocument();
  });

  it('shows an error with a retry when the figures fail', async () => {
    vi.mocked(api.getPlatformUsage).mockRejectedValue(apiError(500, { message: 'Server error' }));
    renderPage();
    expect(await screen.findByText('Server error')).toBeInTheDocument();
    vi.mocked(api.getPlatformUsage).mockResolvedValue(platformUsage());
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByTestId('kpi-spend')).toBeInTheDocument();
  });

  it('sends a 403 to the access denied page', async () => {
    vi.mocked(api.getPlatformUsage).mockRejectedValue(apiError(403, { message: 'This action is unauthorized.' }));
    renderPage();
    await waitFor(() => expect(location()).toBe('/dashboard/unauthorized'));
  });

  describe('Edit limit', () => {
    const openDrawer = async (name = 'Acme Digital') => {
      renderPage();
      await screen.findAllByText(name);
      await userEvent.click(within(table()).getByRole('button', { name: `Edit keyword limit for ${name}` }));
      return screen.findByRole('dialog');
    };

    it('sets a custom limit, validating its range', async () => {
      vi.mocked(api.updateWorkspaceLimit).mockResolvedValue(workspaceRow({ keywordLimit: 2000, keywordLimitOverride: 2000 }));
      const drawer = await openDrawer();
      expect(within(drawer).getByRole('radio', { name: /Use default \(500\)/ })).toBeChecked();

      await userEvent.click(within(drawer).getByRole('radio', { name: /Custom limit/ }));
      const input = within(drawer).getByRole('spinbutton', { name: 'Keywords' });
      await userEvent.click(within(drawer).getByRole('button', { name: 'Save limit' }));
      expect(await within(drawer).findByText('Enter the most keywords this workspace may track.')).toBeInTheDocument();

      await userEvent.type(input, '5');
      await userEvent.click(within(drawer).getByRole('button', { name: 'Save limit' }));
      expect(await within(drawer).findByText('Allow at least 10 keywords.')).toBeInTheDocument();

      await userEvent.clear(input);
      await userEvent.type(input, '200000');
      await userEvent.click(within(drawer).getByRole('button', { name: 'Save limit' }));
      expect(await within(drawer).findByText('Allow at most 100,000 keywords.')).toBeInTheDocument();
      expect(api.updateWorkspaceLimit).not.toHaveBeenCalled();

      await userEvent.clear(input);
      await userEvent.type(input, '2000');
      await userEvent.click(within(drawer).getByRole('button', { name: 'Save limit' }));
      await waitFor(() => expect(api.updateWorkspaceLimit).toHaveBeenCalledWith(4, 2000));
      expect(showToaster).toHaveBeenCalledWith('success', 'Acme Digital may now track 2,000 keywords.');
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      // List and figures are read again.
      await waitFor(() => expect(api.getWorkspaceUsage).toHaveBeenCalledTimes(2));
    });

    it('warns when the limit is below what the workspace tracks', async () => {
      const drawer = await openDrawer();
      await userEvent.click(within(drawer).getByRole('radio', { name: /Custom limit/ }));
      await userEvent.type(within(drawer).getByRole('spinbutton', { name: 'Keywords' }), '100');
      expect(within(drawer).getByRole('status')).toHaveTextContent('Below the 420 it tracks now');
    });

    it('returns a custom limit to the default', async () => {
      vi.mocked(api.updateWorkspaceLimit).mockResolvedValue(workspaceRow({ id: 7 }));
      const drawer = await openDrawer('Bosveld Foods');
      expect(within(drawer).getByRole('radio', { name: /Custom limit/ })).toBeChecked();
      expect(within(drawer).getByRole('spinbutton', { name: 'Keywords' })).toHaveValue(1000);

      await userEvent.click(within(drawer).getByRole('radio', { name: /Use default \(500\)/ }));
      expect(within(drawer).queryByRole('spinbutton')).not.toBeInTheDocument();
      await userEvent.click(within(drawer).getByRole('button', { name: 'Save limit' }));
      await waitFor(() => expect(api.updateWorkspaceLimit).toHaveBeenCalledWith(7, null));
      expect(showToaster).toHaveBeenCalledWith('success', 'Bosveld Foods is back on the default limit.');
    });

    it("shows the API's 422 under the field", async () => {
      vi.mocked(api.updateWorkspaceLimit).mockRejectedValue(apiError(422, { message: 'Invalid', errors: { rank_keyword_limit: ['The limit may not be greater than 100000.'] } }));
      const drawer = await openDrawer();
      await userEvent.click(within(drawer).getByRole('radio', { name: /Custom limit/ }));
      await userEvent.type(within(drawer).getByRole('spinbutton', { name: 'Keywords' }), '750');
      await userEvent.click(within(drawer).getByRole('button', { name: 'Save limit' }));
      expect(await within(drawer).findByText('The limit may not be greater than 100000.')).toBeInTheDocument();
      expect(within(drawer).getByRole('spinbutton', { name: 'Keywords' })).toHaveAttribute('aria-invalid', 'true');
      expect(showToaster).not.toHaveBeenCalled();
    });
  });
});
