import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { apiError, renderAt } from '@/test/renderWithProviders';
import showToaster from '@/utils/showToaster';
import * as api from '../api/localGridApi';
import type { Grid } from '../types';
import { BUSINESS, candidate, grid, scan, site, usage } from '../test/fixtures';
import LocalGridSitePage from './LocalGridSitePage';

vi.mock('../api/localGridApi');
vi.mock('@/utils/showToaster', () => ({ default: vi.fn() }));
// jsdom can't run Leaflet: the preview stands in as a button that moves the centre.
vi.mock('../components/map/GridPreviewMap', () => ({
  default: ({ center, onCenterChange }: { center: { lat: number; lng: number }; onCenterChange?: (c: { lat: number; lng: number }) => void }) => (
    <div data-testid="preview-map" data-center={`${center.lat},${center.lng}`}>
      <button type="button" onClick={() => onCenterChange?.({ lat: -26.2, lng: 28.1 })}>
        Move centre
      </button>
    </div>
  ),
}));

const permissions = vi.hoisted(() => ({ list: [] as string[] }));
vi.mock('@/contexts/PermissionContextType', () => ({
  usePermissions: () => ({ hasPermission: (p: string) => permissions.list.includes(p) }),
}));

const MANAGER = ['view_local_grid', 'create_local_grid', 'update_local_grid', 'delete_local_grid'];
const VIEWER = ['view_local_grid'];
const MONEY = /\$|cost|balance|price|credit|dataforseo|top up/i;

const PATH = '/dashboard/local-grid';
const renderPage = () =>
  renderAt(`${PATH}/7`, [
    { path: `${PATH}/:siteId`, element: <LocalGridSitePage /> },
    { path: `${PATH}/:siteId/:gridId`, element: <p>Grid page</p> },
  ]);
const table = () => screen.getAllByRole('table')[0];
const findRow = async (keyword: string) => {
  await waitFor(() => expect(within(table()).getAllByText(keyword).length).toBeGreaterThan(0));
  return within(table()).getAllByText(keyword)[0].closest('tr') as HTMLElement;
};
const openMenu = async (row: HTMLElement, keyword: string) => {
  await userEvent.click(within(row).getByRole('button', { name: `Actions for ${keyword}` }));
  return screen.findByRole('menu');
};

function serve(grids: Grid[] = [grid(), grid({ id: 52, keyword: 'espresso bar', isActive: false, schedule: 'none', nextScanOn: null, latestScan: null })]) {
  vi.mocked(api.getLocalGridSites).mockResolvedValue([site()]);
  vi.mocked(api.getLocalGridUsage).mockResolvedValue(usage());
  vi.mocked(api.getSiteGrids).mockResolvedValue(grids);
}

describe('LocalGridSitePage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    permissions.list = MANAGER;
  });

  it('lists the grids with their latest heatmap, figures and schedule, without any money', async () => {
    serve();
    renderPage();

    const row = await findRow('coffee shop');
    expect(screen.getByRole('heading', { level: 1, name: 'Karoo Coffee' })).toBeInTheDocument();
    expect(within(table()).getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['Keyword', 'Grid', 'Heatmap', 'Avg rank', 'Top 3 share', 'Found', 'Last scan', 'Schedule', 'Actions']);
    expect(row).toHaveTextContent(BUSINESS.title);
    expect(row).toHaveTextContent('3×3 · 1 km');
    expect(row).toHaveTextContent('Mobile');
    expect(row).toHaveTextContent('4.3');
    expect(row).toHaveTextContent('44%');
    expect(row).toHaveTextContent('78%');
    expect(row).toHaveTextContent('19/11/2026');
    expect(row).toHaveTextContent('Weekly');
    expect(row).toHaveTextContent('Next 26/11/2026');
    // The list's ranks draw the mini heatmap: no scan is fetched per row.
    const mini = within(row).getByTestId('mini-heatmap');
    expect(mini).toHaveAccessibleName(/4 of 9 points in the top 3, 2 in 4–10, 1 in 11–20, 2 not in the top 20/);
    expect(api.getScan).not.toHaveBeenCalled();

    const paused = await findRow('espresso bar');
    expect(paused).toHaveTextContent('Paused');
    expect(paused).toHaveTextContent('Not scanned yet');
    // Usage in the header; a paginator under the table.
    expect(within(screen.getByRole('region', { name: 'Local grid usage' })).getByTestId('grids-used')).toHaveTextContent('3 of 10');
    expect(screen.getByRole('button', { name: 'Next page' })).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(MONEY);
  });

  it('opens a grid from its row', async () => {
    serve();
    renderPage();
    await userEvent.click(within(await findRow('coffee shop')).getByRole('button', { name: /^coffee shop/ }));
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(`${PATH}/7/51`));
  });

  it('invites a manager to create the first grid; a viewer only reads', async () => {
    serve([]);
    const { unmount } = renderPage();
    expect(await screen.findByRole('heading', { name: 'Create your first local grid' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'New grid' }));
    expect(await screen.findByRole('dialog', { name: 'New grid' })).toBeInTheDocument();
    unmount();

    permissions.list = VIEWER;
    renderPage();
    expect(await screen.findByText(/No local grids for this site yet/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'New grid' })).not.toBeInTheDocument();
  });

  it('gives a viewer only Open in the row menu', async () => {
    permissions.list = VIEWER;
    serve();
    renderPage();
    const menu = await openMenu(await findRow('coffee shop'), 'coffee shop');
    expect(within(menu).getAllByRole('menuitem').map((i) => i.textContent)).toEqual(['Open heatmap']);
  });

  it('says when the site is not found', async () => {
    serve();
    vi.mocked(api.getLocalGridSites).mockResolvedValue([]);
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Site not found' })).toBeInTheDocument();
  });

  describe('row actions', () => {
    it('scans now and says so', async () => {
      serve();
      vi.mocked(api.scanGrid).mockResolvedValue(scan({ id: 902, status: 'queued', pointsDone: 0 }));
      renderPage();
      await openMenu(await findRow('coffee shop'), 'coffee shop');
      await userEvent.click(screen.getByRole('menuitem', { name: 'Scan now' }));

      await waitFor(() => expect(api.scanGrid).toHaveBeenCalledWith(51));
      expect(showToaster).toHaveBeenCalledWith('default', expect.stringContaining('Scanning “coffee shop” now'));
    });

    it('shows the API’s message past today’s scans', async () => {
      serve();
      vi.mocked(api.scanGrid).mockRejectedValue(apiError(429, { error_type: 'scan_limit', message: "You've used today's 10 scans. They reset at midnight." }));
      renderPage();
      await openMenu(await findRow('coffee shop'), 'coffee shop');
      await userEvent.click(screen.getByRole('menuitem', { name: 'Scan now' }));
      await waitFor(() => expect(showToaster).toHaveBeenCalledWith('error', "You've used today's 10 scans. They reset at midnight."));
    });

    it('disables Scan now with the reason when none are left, or the grid is paused', async () => {
      serve();
      vi.mocked(api.getLocalGridUsage).mockResolvedValue(usage({ scansToday: { used: 10, limit: 10 } }));
      renderPage();
      await screen.findByTestId('scans-today');
      const menu = await openMenu(await findRow('coffee shop'), 'coffee shop');
      expect(within(menu).getByRole('menuitem', { name: 'Scan now' })).toHaveAttribute('aria-disabled', 'true');
      expect(menu).toHaveTextContent("You've used all 10 scans for today.");
    });

    it('shows a running scan instead of the heatmap', async () => {
      serve([grid({ latestScan: scan({ status: 'running', pointsDone: 3, ranks: undefined }) })]);
      renderPage();
      const row = await findRow('coffee shop');
      expect(within(row).queryByTestId('mini-heatmap')).not.toBeInTheDocument();
      expect(row).toHaveTextContent('Scanning33%');
    });

    it('stays calm on a paused grid or while scans are on hold', async () => {
      serve();
      vi.mocked(api.scanGrid).mockRejectedValueOnce(apiError(409, { error_type: 'local_grid_paused', message: 'Local grid scans are paused for now. Your grids are safe and scans resume automatically.' }));
      renderPage();
      await openMenu(await findRow('coffee shop'), 'coffee shop');
      await userEvent.click(screen.getByRole('menuitem', { name: 'Scan now' }));
      await waitFor(() => expect(showToaster).toHaveBeenCalledWith('default', 'Local grid scans are paused for now. Your grids are safe and scans resume automatically.'));

      vi.mocked(api.scanGrid).mockRejectedValueOnce(apiError(409, { error_type: 'grid_inactive', message: 'Resume this grid to scan it.' }));
      await openMenu(await findRow('coffee shop'), 'coffee shop');
      await userEvent.click(screen.getByRole('menuitem', { name: 'Scan now' }));
      await waitFor(() => expect(showToaster).toHaveBeenCalledWith('default', 'Resume this grid to scan it.'));
    });

    it('shows the active-grid limit when resuming over it', async () => {
      serve();
      vi.mocked(api.updateGrid).mockRejectedValue(apiError(422, { message: 'Invalid', errors: { is_active: ['This workspace can have up to 10 active local grids.'] } }));
      renderPage();
      await openMenu(await findRow('espresso bar'), 'espresso bar');
      await userEvent.click(screen.getByRole('menuitem', { name: 'Resume' }));
      await waitFor(() => expect(showToaster).toHaveBeenCalledWith('error', 'This workspace can have up to 10 active local grids.'));
    });

    it('pauses and resumes', async () => {
      serve();
      vi.mocked(api.updateGrid).mockResolvedValue(grid({ isActive: false }));
      renderPage();
      await openMenu(await findRow('coffee shop'), 'coffee shop');
      await userEvent.click(screen.getByRole('menuitem', { name: 'Pause' }));
      await waitFor(() => expect(api.updateGrid).toHaveBeenCalledWith(51, { isActive: false }));

      await openMenu(await findRow('espresso bar'), 'espresso bar');
      expect(screen.getByRole('menuitem', { name: 'Scan now' })).toHaveAttribute('aria-disabled', 'true');
      await userEvent.click(screen.getByRole('menuitem', { name: 'Resume' }));
      await waitFor(() => expect(api.updateGrid).toHaveBeenCalledWith(52, { isActive: true }));
    });

    it('deletes after confirming', async () => {
      serve();
      vi.mocked(api.deleteGrid).mockResolvedValue();
      renderPage();
      await openMenu(await findRow('coffee shop'), 'coffee shop');
      await userEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));
      const dialog = await screen.findByRole('alertdialog', { name: 'Delete this grid?' });
      await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
      await waitFor(() => expect(api.deleteGrid).toHaveBeenCalledWith(51));
      expect(showToaster).toHaveBeenCalledWith('success', '“coffee shop” deleted.');
    });
  });

  describe('create drawer', () => {
    const openDrawer = async () => {
      renderPage();
      await findRow('coffee shop');
      await userEvent.click(screen.getByRole('button', { name: 'New grid' }));
      return screen.findByRole('dialog', { name: 'New grid' });
    };

    it('needs a keyword and a business', async () => {
      serve();
      const drawer = await openDrawer();
      await userEvent.click(within(drawer).getByRole('button', { name: 'Create grid' }));

      expect(await within(drawer).findByText('Enter at least 2 characters.')).toBeInTheDocument();
      expect(within(drawer).getByText('Search for the business and choose its listing.')).toBeInTheDocument();
      expect(within(drawer).getByText('Choose the business first')).toBeInTheDocument();
      expect(api.createGrid).not.toHaveBeenCalled();
    });

    it('searches for the business, places the grid on it, and creates it with a first scan', async () => {
      serve();
      vi.mocked(api.searchBusinesses).mockResolvedValue([candidate(), candidate({ title: 'Karoo Coffee Rosebank', placeId: 'ChIJrose', cid: null, address: 'Rosebank' })]);
      vi.mocked(api.createGrid).mockResolvedValue({ grid: grid({ id: 53, keyword: 'coffee near me' }), scanError: null });
      const drawer = await openDrawer();

      expect(within(drawer).getByTestId('searches-today')).toHaveTextContent('Searches today 3 of 30');
      await userEvent.type(within(drawer).getByLabelText('Keyword'), 'coffee near me');
      // Enter in the search box searches; it doesn't submit the drawer.
      await userEvent.type(within(drawer).getByLabelText('Business'), 'karoo coffee{Enter}');
      await waitFor(() => expect(api.searchBusinesses).toHaveBeenCalledWith(7, { query: 'karoo coffee' }));
      expect(api.createGrid).not.toHaveBeenCalled();

      await userEvent.click(await within(drawer).findByRole('button', { name: 'Choose Karoo Coffee Sandton, 12 Rivonia Rd, Sandton' }));
      expect(within(drawer).getByTestId('chosen-business')).toHaveTextContent('Karoo Coffee Sandton');
      expect(within(drawer).getByTestId('preview-map')).toHaveAttribute('data-center', '-26.1,28.05');
      expect(within(drawer).getByTestId('grid-coverage')).toHaveTextContent('25 points covering 4 km × 4 km');

      // Click the map to move the centre; a 7×7 at 0.5 km.
      await userEvent.click(within(drawer).getByRole('button', { name: 'Move centre' }));
      expect(within(drawer).getByTestId('grid-centre')).toHaveTextContent('-26.2000, 28.1000');
      await userEvent.click(within(drawer).getByRole('button', { name: /7×7/ }));
      expect(within(drawer).getByTestId('grid-coverage')).toHaveTextContent('49 points covering 6 km × 6 km');
      await userEvent.click(within(drawer).getByRole('button', { name: 'Desktop' }));
      await userEvent.click(within(drawer).getByRole('radio', { name: /Weekly/ }));
      expect(within(drawer).getByRole('checkbox', { name: /Scan as soon as it's saved/ })).toBeChecked();

      await userEvent.click(within(drawer).getByRole('button', { name: 'Create grid' }));
      await waitFor(() =>
        expect(api.createGrid).toHaveBeenCalledWith(7, {
          keyword: 'coffee near me',
          business: { title: 'Karoo Coffee Sandton', placeId: 'ChIJkaroo', cid: '123456', address: '12 Rivonia Rd, Sandton', lat: -26.1, lng: 28.05 },
          centerLat: -26.2,
          centerLng: 28.1,
          size: 7,
          spacingKm: 1,
          device: 'desktop',
          schedule: 'weekly',
          scanNow: true,
        }),
      );
      // The new grid opens.
      await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(`${PATH}/7/53`));
      expect(document.body.textContent).not.toMatch(MONEY);
    });

    it('binds the API’s 422 to the field', async () => {
      serve();
      vi.mocked(api.searchBusinesses).mockResolvedValue([candidate()]);
      vi.mocked(api.createGrid).mockRejectedValue(apiError(422, { message: 'Invalid', errors: { keyword: ['This workspace can have up to 10 local grids.'], 'business.place_id': ['This business is already tracked here.'] } }));
      const drawer = await openDrawer();
      await userEvent.type(within(drawer).getByLabelText('Keyword'), 'coffee');
      await userEvent.type(within(drawer).getByLabelText('Business'), 'karoo');
      await userEvent.click(within(drawer).getByRole('button', { name: 'Search' }));
      await userEvent.click(await within(drawer).findByRole('button', { name: /Choose Karoo Coffee Sandton/ }));
      await userEvent.click(within(drawer).getByRole('button', { name: 'Create grid' }));

      expect(await within(drawer).findByText('This workspace can have up to 10 local grids.')).toBeInTheDocument();
      expect(screen.getByRole('dialog', { name: 'New grid' })).toBeInTheDocument();
    });

    it('saves the grid and says why when its first scan could not start', async () => {
      serve();
      vi.mocked(api.searchBusinesses).mockResolvedValue([candidate()]);
      vi.mocked(api.createGrid).mockResolvedValue({ grid: grid({ id: 53 }), scanError: { message: "You've used today's 10 scans. They reset at midnight.", errorType: 'scan_limit' } });
      const drawer = await openDrawer();
      await userEvent.type(within(drawer).getByLabelText('Keyword'), 'coffee');
      await userEvent.type(within(drawer).getByLabelText('Business'), 'karoo');
      await userEvent.click(within(drawer).getByRole('button', { name: 'Search' }));
      await userEvent.click(await within(drawer).findByRole('button', { name: /Choose Karoo Coffee Sandton/ }));
      await userEvent.click(within(drawer).getByRole('button', { name: 'Create grid' }));

      await waitFor(() => expect(showToaster).toHaveBeenCalledWith('default', "Grid saved. You've used today's 10 scans. They reset at midnight."));
      await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(`${PATH}/7/53`));
    });

    it('shows the API’s message when the search fails', async () => {
      serve();
      vi.mocked(api.searchBusinesses).mockRejectedValue(apiError(502, { error_type: 'search_failed', message: 'The business search is unavailable right now. Try again shortly.' }));
      const drawer = await openDrawer();
      await userEvent.type(within(drawer).getByLabelText('Business'), 'karoo');
      await userEvent.click(within(drawer).getByRole('button', { name: 'Search' }));
      expect(await within(drawer).findByText('The business search is unavailable right now. Try again shortly.')).toBeInTheDocument();
    });

    it('shows the API’s message when today’s searches are used up', async () => {
      serve();
      vi.mocked(api.searchBusinesses).mockRejectedValue(apiError(429, { error_type: 'search_limit', message: "You've used today's 30 business searches." }));
      const drawer = await openDrawer();
      await userEvent.type(within(drawer).getByLabelText('Business'), 'karoo');
      await userEvent.click(within(drawer).getByRole('button', { name: 'Search' }));
      expect(await within(drawer).findByText("You've used today's 30 business searches.")).toBeInTheDocument();
    });

    it('stops at the grid limit', async () => {
      serve();
      vi.mocked(api.getLocalGridUsage).mockResolvedValue(usage({ grids: { used: 10, limit: 10 } }));
      renderPage();
      await findRow('coffee shop');
      expect(screen.getByRole('button', { name: 'New grid' })).toBeDisabled();
    });
  });

  describe('edit drawer', () => {
    it('locks the business and saves the rest', async () => {
      serve();
      vi.mocked(api.updateGrid).mockResolvedValue(grid({ keyword: 'best coffee' }));
      renderPage();
      await openMenu(await findRow('coffee shop'), 'coffee shop');
      await userEvent.click(screen.getByRole('menuitem', { name: 'Edit' }));
      const drawer = await screen.findByRole('dialog', { name: 'Edit grid' });

      expect(within(drawer).getByTestId('locked-business')).toHaveTextContent(BUSINESS.title);
      expect(within(drawer).queryByRole('button', { name: 'Search' })).not.toBeInTheDocument();
      expect(within(drawer).queryByRole('checkbox', { name: /Scan as soon/ })).not.toBeInTheDocument();
      const keyword = within(drawer).getByLabelText('Keyword');
      expect(keyword).toHaveValue('coffee shop');
      await userEvent.clear(keyword);
      await userEvent.type(keyword, 'best coffee');
      await userEvent.click(within(drawer).getByRole('radio', { name: /Monthly/ }));
      await userEvent.click(within(drawer).getByRole('button', { name: 'Save changes' }));

      await waitFor(() =>
        expect(api.updateGrid).toHaveBeenCalledWith(51, {
          keyword: 'best coffee',
          centerLat: -26.1076,
          centerLng: 28.0567,
          size: 3,
          spacingKm: 1,
          device: 'mobile',
          schedule: 'monthly',
          isActive: true,
        }),
      );
      expect(showToaster).toHaveBeenCalledWith('success', '“best coffee” saved.');
    });
  });
});
