import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { apiError, renderAt } from '@/test/renderWithProviders';
import * as api from '../api/reportsApi';
import { detail, schedule } from '../test/fixtures';
import ReportPreviewPage from './ReportPreviewPage';

vi.mock('../api/reportsApi');
vi.mock('@/utils/showToaster', () => ({ default: vi.fn() }));

const permissions = vi.hoisted(() => ({ list: [] as string[] }));
vi.mock('@/contexts/PermissionContextType', () => ({
  usePermissions: () => ({ hasPermission: (p: string) => permissions.list.includes(p) }),
}));

const PATH = '/dashboard/reports';
const renderPage = () =>
  renderAt(`${PATH}/7/41`, [
    { path: `${PATH}/:siteId/:reportId`, element: <ReportPreviewPage /> },
    { path: `${PATH}/:siteId`, element: <p>Site reports</p> },
  ]);

describe('ReportPreviewPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    permissions.list = ['view_reports', 'create_reports', 'delete_reports'];
    vi.mocked(api.getSchedule).mockResolvedValue(schedule());
  });

  it('renders the report as the client sees it, under the action bar', async () => {
    vi.mocked(api.getReport).mockResolvedValue(detail());
    renderPage();

    const bar = await screen.findByRole('toolbar', { name: 'Report actions' });
    for (const name of ['Download PDF', 'Share', 'Send', 'Delete report']) expect(within(bar).getByRole('button', { name })).toBeInTheDocument();
    expect(screen.getByTestId('report-view')).toHaveAttribute('data-brand', '#0b6e4f');
    expect(screen.getByRole('region', { name: 'At a glance' })).toHaveTextContent('Traffic up 14%');
  });

  it('downloads the PDF', async () => {
    vi.mocked(api.getReport).mockResolvedValue(detail());
    vi.mocked(api.downloadReportPdf).mockResolvedValue({ blob: new Blob(['%PDF']), filename: 'karoo-october-2026.pdf' });
    const createObjectURL = vi.fn(() => 'blob:x');
    Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    renderPage();

    await userEvent.click(within(await screen.findByRole('toolbar', { name: 'Report actions' })).getByRole('button', { name: 'Download PDF' }));
    await waitFor(() => expect(click).toHaveBeenCalled());
    expect(api.downloadReportPdf).toHaveBeenCalledWith(41);
    expect((click.mock.contexts[0] as HTMLAnchorElement).download).toBe('karoo-october-2026.pdf');
    click.mockRestore();
  });

  it('shows a client the report and the download only', async () => {
    permissions.list = ['view_reports'];
    vi.mocked(api.getReport).mockResolvedValue(detail());
    renderPage();

    const bar = await screen.findByRole('toolbar', { name: 'Report actions' });
    expect(within(bar).getAllByRole('button').map((b) => b.textContent)).toEqual(['Download PDF']);
  });

  it('waits while the report is generating', async () => {
    vi.mocked(api.getReport).mockResolvedValue(detail({ status: 'generating', data: null }));
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Generating the report…' })).toBeInTheDocument();
  });

  it('says when the report is gone', async () => {
    vi.mocked(api.getReport).mockRejectedValue(apiError(404, { message: 'Not found.' }));
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Report not found' })).toBeInTheDocument();
  });

  it('goes back to the site after deleting', async () => {
    vi.mocked(api.getReport).mockResolvedValue(detail());
    vi.mocked(api.deleteReport).mockResolvedValue();
    renderPage();

    await userEvent.click(within(await screen.findByRole('toolbar', { name: 'Report actions' })).getByRole('button', { name: 'Delete report' }));
    await userEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(`${PATH}/7`));
  });
});
