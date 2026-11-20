import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { apiError, renderAt } from '@/test/renderWithProviders';
import showToaster from '@/utils/showToaster';
import * as api from '../api/localGridApi';
import { pointName } from '../lib/rank';
import type { ScanPoint } from '../types';
import { BUSINESS, OLDER, gridDetail, points, scan, scanDetail, site, usage } from '../test/fixtures';
import LocalGridDetailPage from './LocalGridDetailPage';

vi.mock('../api/localGridApi');
vi.mock('@/utils/showToaster', () => ({ default: vi.fn() }));
// jsdom can't run Leaflet: the map stands in as one button per point, and a way to fail the tiles.
vi.mock('../components/map/HeatmapMap', () => ({
  default: ({ points: pts, onSelect, onTilesFailed }: { points: ScanPoint[]; onSelect: (p: ScanPoint) => void; onTilesFailed?: () => void }) => (
    <div data-testid="heatmap-map">
      {pts.map((p) => (
        <button key={`${p.row}-${p.col}`} type="button" onClick={() => onSelect(p)}>
          {`Map marker ${pointName(p)}`}
        </button>
      ))}
      <button type="button" onClick={onTilesFailed}>
        Fail tiles
      </button>
    </div>
  ),
}));
vi.mock('../components/map/GridPreviewMap', () => ({ default: () => <div data-testid="preview-map" /> }));

const permissions = vi.hoisted(() => ({ list: [] as string[] }));
vi.mock('@/contexts/PermissionContextType', () => ({
  usePermissions: () => ({ hasPermission: (p: string) => permissions.list.includes(p) }),
}));

const MANAGER = ['view_local_grid', 'create_local_grid', 'update_local_grid', 'delete_local_grid'];
const MONEY = /\$|cost|balance|price|credit|dataforseo|top up/i;
const PATH = '/dashboard/local-grid';
const renderPage = (search = '') => renderAt(`${PATH}/7/51${search}`, [{ path: `${PATH}/:siteId/:gridId`, element: <LocalGridDetailPage /> }]);

function serve() {
  vi.mocked(api.getLocalGridSites).mockResolvedValue([site()]);
  vi.mocked(api.getLocalGridUsage).mockResolvedValue(usage());
  vi.mocked(api.getGrid).mockResolvedValue(gridDetail());
  vi.mocked(api.getScan).mockImplementation(async (id) => (id === OLDER.id ? scanDetail({ ...OLDER, competitors: [] }) : scanDetail()));
}

describe('LocalGridDetailPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    permissions.list = MANAGER;
  });

  it('shows the latest scan’s figures, heatmap, legend and competitors, without any money', async () => {
    serve();
    renderPage();

    expect(await screen.findByRole('heading', { level: 1, name: 'coffee shop' })).toBeInTheDocument();
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(within(crumbs).getByRole('link', { name: 'Karoo Coffee' })).toHaveAttribute('href', `${PATH}/7`);
    expect(within(crumbs).getByRole('link', { name: 'Local grid' })).toHaveAttribute('href', PATH);
    expect(screen.getByText(BUSINESS.title)).toBeInTheDocument();

    expect(await screen.findByText('Average rank (ARP)')).toBeInTheDocument();
    expect(screen.getAllByText('4.3').length).toBeGreaterThan(0);
    expect(screen.getByText('Where found · lower is better · was 6.1')).toBeInTheDocument();
    expect(screen.getByText('Share of local voice')).toBeInTheDocument();
    expect(screen.getByText('7 of 9 points · was 67%')).toBeInTheDocument();
    expect(screen.getByText('Average total rank')).toBeInTheDocument();

    const legend = screen.getByRole('list', { name: 'Legend' });
    expect(legend).toHaveTextContent('1–34');
    expect(legend).toHaveTextContent('4–102');
    expect(legend).toHaveTextContent('11–201');
    expect(legend).toHaveTextContent('Not in the top 202');
    expect(within(screen.getByTestId('heatmap-map')).getAllByRole('button', { name: /^Map marker/ })).toHaveLength(9);

    const competitors = screen.getByRole('region', { name: 'Competitors' });
    const rows = within(competitors).getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Bean There');
    expect(rows[1]).toHaveTextContent('6 of 9');
    expect(rows[2]).toHaveTextContent('Your business');
    expect(document.body.textContent).not.toMatch(MONEY);
  });

  it('opens a point’s top 3 with the business highlighted', async () => {
    serve();
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: 'Map marker Row 1, column 1: rank 1' }));

    const drawer = await screen.findByRole('dialog', { name: 'Row 1, column 1' });
    expect(drawer).toHaveTextContent('Karoo Coffee Sandton is #1 in the map results here.');
    const items = within(drawer).getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveAttribute('data-target', 'true');
    expect(items[0]).toHaveTextContent('Your business');
    expect(items[1]).toHaveTextContent('Father Coffee');
    expect(within(drawer).getAllByRole('button', { name: 'Close' }).length).toBeGreaterThan(0);
  });

  it('says when the business isn’t in the top 20 at a point', async () => {
    serve();
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: 'Map marker Row 3, column 1: not in the top 20' }));
    expect(await screen.findByRole('dialog', { name: 'Row 3, column 1' })).toHaveTextContent("Karoo Coffee Sandton isn't in the top 20 here.");
  });

  it('falls back to the plain grid when map tiles fail, and offers it as a view', async () => {
    serve();
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: 'Grid' }));
    const grid = screen.getByRole('group', { name: 'Heatmap grid, north at the top' });
    const cells = within(grid).getAllByRole('button');
    expect(cells.map((c) => c.textContent)).toEqual(['1', '2', '5', '3', '1', '12', '20+', '8', '20+']);
    expect(cells[0]).toHaveAttribute('data-tone', 'top3');
    expect(cells[2]).toHaveAttribute('data-tone', 'top10');
    expect(cells[5]).toHaveAttribute('data-tone', 'top20');
    expect(cells[6]).toHaveAttribute('data-tone', 'none');

    await userEvent.click(screen.getByRole('button', { name: 'Map' }));
    await userEvent.click(screen.getByRole('button', { name: 'Fail tiles' }));
    expect(screen.getByText(/The map couldn't load/)).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Heatmap grid, north at the top' })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Heatmap view' })).not.toBeInTheDocument();
  });

  it('shows an earlier scan picked from the history', async () => {
    serve();
    renderPage(`?scan=${OLDER.id}`);
    expect(await screen.findByRole('heading', { name: 'An earlier scan' })).toBeInTheDocument();
    await waitFor(() => expect(api.getScan).toHaveBeenCalledWith(OLDER.id));
    expect(await screen.findByText('6.1')).toBeInTheDocument();
    expect(screen.getByText('No competitors recorded for this scan.')).toBeInTheDocument();
  });

  it('shows a running scan’s progress, with its unchecked points pending', async () => {
    serve();
    const running = scan({ id: 903, status: 'running', pointsDone: 4, pointsFound: 3, arp: null, atrp: null, solv: null, foundPct: null, finishedAt: null });
    vi.mocked(api.getGrid).mockResolvedValue(gridDetail({ latestScan: running, scans: [running, scan()] }));
    vi.mocked(api.getScan).mockResolvedValue(scanDetail({ ...running, points: points([1, 4, null, 2]).slice(0, 4), competitors: [] }));
    renderPage();

    expect(await screen.findByText('Scanning the grid')).toBeInTheDocument();
    expect(screen.getByTestId('scan-progress')).toHaveTextContent('4 of 9 points');
    expect(screen.getByRole('progressbar', { name: 'Points checked' })).toHaveAttribute('aria-valuenow', '4');
    expect(screen.getAllByRole('button', { name: /not checked yet/ })).toHaveLength(5);
    expect(screen.queryByRole('region', { name: 'Competitors' })).not.toBeInTheDocument();
    // A scan is under way: Scan now waits.
    expect(screen.getByRole('button', { name: 'Scan now' })).toBeDisabled();
  });

  it('scans now, and shows the API’s message when one is already running', async () => {
    serve();
    vi.mocked(api.scanGrid).mockRejectedValueOnce(apiError(409, { error_type: 'scan_running', message: 'A scan of this grid is already under way.' }));
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: 'Scan now' }));
    await waitFor(() => expect(showToaster).toHaveBeenCalledWith('default', 'A scan of this grid is already under way.'));

    vi.mocked(api.scanGrid).mockResolvedValueOnce(scan({ id: 904, status: 'queued' }));
    await userEvent.click(screen.getByRole('button', { name: 'Scan now' }));
    await waitFor(() => expect(showToaster).toHaveBeenCalledWith('default', expect.stringContaining('Scanning “coffee shop” now')));
  });

  it('hides Scan now and Edit from a viewer', async () => {
    permissions.list = ['view_local_grid'];
    serve();
    renderPage();
    await screen.findByText('Average rank (ARP)');
    expect(screen.queryByRole('button', { name: 'Scan now' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
  });

  it('invites the first scan when there is none', async () => {
    serve();
    vi.mocked(api.getGrid).mockResolvedValue(gridDetail({ latestScan: null, scans: [] }));
    renderPage();
    expect(await screen.findByRole('heading', { name: 'No scans yet' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Scan now' })).toHaveLength(2);
  });

  it('says when a scan is gone because its grid was deleted', async () => {
    serve();
    vi.mocked(api.getScan).mockRejectedValue(apiError(404, { message: 'Not found.' }));
    renderPage();
    expect(await screen.findByRole('heading', { name: 'This scan is no longer available' })).toBeInTheDocument();
    expect(api.getScan).toHaveBeenCalledTimes(1);
  });

  it('shows a failed scan’s neutral reason', async () => {
    serve();
    const failed = scan({ id: 905, status: 'failed', pointsDone: 9, pointsFound: 0, arp: null, atrp: null, solv: null, foundPct: null, error: 'The map results could not be read. Try again later.' });
    vi.mocked(api.getGrid).mockResolvedValue(gridDetail({ latestScan: failed, scans: [failed, scan()] }));
    vi.mocked(api.getScan).mockResolvedValue(scanDetail({ ...failed, points: points(Array(9).fill(null), 'failed'), competitors: [] }));
    renderPage();
    expect(await screen.findByText('This scan failed.')).toBeInTheDocument();
    expect(screen.getByText(/The map results could not be read/)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(MONEY);
  });

  it('says when the grid is not found', async () => {
    serve();
    vi.mocked(api.getGrid).mockRejectedValue(apiError(404, { message: 'Not found.' }));
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Grid not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: "Back to the site's grids" })).toHaveAttribute('href', `${PATH}/7`);
  });
});
