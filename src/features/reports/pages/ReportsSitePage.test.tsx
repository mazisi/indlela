import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { apiError, renderAt } from '@/test/renderWithProviders';
import showToaster from '@/utils/showToaster';
import * as api from '../api/reportsApi';
import { monthOptions, monthRange } from '../lib/period';
import { nextRunLabel } from '../lib/schedule';
import { page, row, schedule, site } from '../test/fixtures';
import type { ReportRow } from '../types';
import ReportsSitePage from './ReportsSitePage';

vi.mock('../api/reportsApi');
vi.mock('@/utils/showToaster', () => ({ default: vi.fn() }));

const permissions = vi.hoisted(() => ({ list: [] as string[] }));
vi.mock('@/contexts/PermissionContextType', () => ({
  usePermissions: () => ({ hasPermission: (p: string) => permissions.list.includes(p) }),
}));

const MANAGER = ['view_reports', 'create_reports', 'delete_reports'];
const CLIENT = ['view_reports'];

const PATH = '/dashboard/reports';
const renderPage = () =>
  renderAt(`${PATH}/7`, [
    { path: `${PATH}/:siteId`, element: <ReportsSitePage /> },
    { path: `${PATH}/:siteId/:reportId`, element: <p>Report preview</p> },
  ]);
const table = () => screen.getAllByRole('table')[0];
/** Opens a row's "…" menu and returns its item names. */
const openMenu = async (r: HTMLElement, title = 'SEO report · October 2026') => {
  await userEvent.click(within(r).getByRole('button', { name: `Actions for ${title}` }));
  const menu = await screen.findByRole('menu');
  return within(menu).getAllByRole('menuitem').map((i) => i.textContent?.trim());
};
const pick = async (name: string) => userEvent.click(await screen.findByRole('menuitem', { name }));
const findRow = async (title: string) => {
  await waitFor(() => expect(within(table()).getAllByText(title).length).toBeGreaterThan(0), { timeout: 5_000 });
  return within(table()).getAllByText(title)[0].closest('tr') as HTMLElement;
};

function serve(rows: ReportRow[] = [row()], sched = schedule()) {
  vi.mocked(api.getReportSites).mockResolvedValue([site({ schedule: sched })]);
  vi.mocked(api.getSiteReports).mockResolvedValue(page(rows));
  vi.mocked(api.getSchedule).mockResolvedValue(sched);
}

describe('ReportsSitePage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    permissions.list = MANAGER;
  });

  describe('list', () => {
    it('shows the schedule and each report with status, summary, delivery and share state', async () => {
      serve([
        row({ sentAt: '2026-11-02T09:00:00+02:00', sentTo: ['thandi@karoocoffee.co.za', 'ops@karoocoffee.co.za'], share: { url: 'http://localhost:5173/r/abc', expiresAt: '2026-12-02T00:00:00+02:00' } }),
        row({ id: 42, title: 'September report', periodLabel: 'September 2026', status: 'failed', error: 'Search Console could not be reached.', summary: [] }),
      ]);
      renderPage();

      const ready = await findRow('SEO report · October 2026');
      expect(ready).toHaveTextContent('Ready');
      expect(ready).toHaveTextContent('Traffic up 14%');
      expect(ready).toHaveTextContent('+2 more');
      expect(ready).toHaveTextContent('thandi@karoocoffee.co.za');
      expect(ready).toHaveTextContent('+1');
      expect(ready).toHaveTextContent('Shared · until 02/12/2026');
      const failed = await findRow('September report');
      expect(failed).toHaveTextContent('Failed');
      expect(failed).toHaveTextContent('Search Console could not be reached.');
      expect(within(failed).queryByRole('button', { name: /Download PDF/ })).not.toBeInTheDocument();

      const strip = screen.getByRole('region', { name: 'Monthly report' });
      expect(strip).toHaveTextContent('Monthly report: Monthly on the 1st at 08:00 · 2 recipients');
      expect(strip).toHaveTextContent('Next report: 1 December 2026 at 08:00');
    });

    it('opens a ready report', async () => {
      serve();
      renderPage();
      await openMenu(await findRow('SEO report · October 2026'));
      await pick('View');
      await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(`${PATH}/7/41`));
    });

    it('invites a manager to generate or schedule the first report', async () => {
      serve([]);
      renderPage();
      expect(await screen.findByRole('heading', { name: 'No reports for this site yet' })).toBeInTheDocument();
      await userEvent.click(screen.getAllByRole('button', { name: 'Generate report' })[1]);
      expect(await screen.findByRole('dialog', { name: 'Generate report' })).toBeInTheDocument();
    });

    it('tells a client there is nothing yet, without any way to create', async () => {
      permissions.list = CLIENT;
      serve([]);
      renderPage();
      expect(await screen.findByText('No reports have been shared with you for this site yet.')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Generate report|Schedule/ })).not.toBeInTheDocument();
    });

    it('says when the site is not found', async () => {
      vi.mocked(api.getReportSites).mockResolvedValue([]);
      renderPage();
      expect(await screen.findByRole('heading', { name: 'Site not found' })).toBeInTheDocument();
    });
  });

  describe('permissions', () => {
    it('gives a client view and download only', async () => {
      permissions.list = CLIENT;
      serve([row({ share: { url: 'http://localhost:5173/r/abc', expiresAt: null } })]);
      renderPage();

      const r = await findRow('SEO report · October 2026');
      expect(await openMenu(r)).toEqual(['View', 'Download PDF']);
      expect(screen.queryByRole('button', { name: 'Generate report' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Change' })).not.toBeInTheDocument();
    });

    it('needs delete_reports to delete', async () => {
      permissions.list = ['view_reports', 'create_reports'];
      serve();
      renderPage();
      const r = await findRow('SEO report · October 2026');
      const items = await openMenu(r);
      expect(items).toContain('Send by email');
      expect(items).not.toContain('Delete');
    });
  });

  describe('generate', () => {
    it('defaults to last month against the previous period with every section, and offers five periods', async () => {
      serve();
      renderPage();
      await userEvent.click(await screen.findByRole('button', { name: 'Generate report' }));
      const drawer = await screen.findByRole('dialog', { name: 'Generate report' });

      const periods = within(drawer).getByRole('radiogroup', { name: 'Period' });
      expect(within(periods).getAllByRole('radio')).toHaveLength(5);
      for (const p of [/Last month/, /This month so far/, /A specific month/, /Last 3 months/, /Custom range/]) expect(within(periods).getByRole('radio', { name: p })).toBeInTheDocument();
      expect(within(drawer).getByRole('radio', { name: /Last month/ })).toBeChecked();
      for (const s of ['Search Console', 'Rank tracking', 'Site audit']) expect(within(drawer).getByRole('checkbox', { name: new RegExp(s) })).toBeChecked();

      vi.mocked(api.generateReport).mockResolvedValue(row({ id: 43, status: 'generating', summary: [] }));
      await userEvent.click(within(drawer).getByRole('button', { name: 'Generate report' }));
      await waitFor(() =>
        expect(api.generateReport).toHaveBeenCalledWith(7, { period: 'last_month', compare: 'previous', sections: ['search_console', 'rank_tracking', 'site_audit'] }),
      );
    });

    it('reports on a chosen month as that whole month', async () => {
      serve();
      renderPage();
      await userEvent.click(await screen.findByRole('button', { name: 'Generate report' }));
      const drawer = await screen.findByRole('dialog', { name: 'Generate report' });

      await userEvent.click(within(drawer).getByRole('radio', { name: /A specific month/ }));
      await userEvent.click(within(drawer).getByRole('combobox', { name: 'Month' }));
      const months = await screen.findAllByRole('option');
      expect(months).toHaveLength(16);
      const pick = monthOptions()[1];
      await userEvent.click(screen.getByRole('option', { name: pick.label }));

      vi.mocked(api.generateReport).mockResolvedValue(row({ id: 44, status: 'generating', summary: [] }));
      await userEvent.click(within(drawer).getByRole('button', { name: 'Generate report' }));
      await waitFor(() =>
        expect(api.generateReport).toHaveBeenCalledWith(7, { period: 'custom', ...monthRange(pick.value), compare: 'previous', sections: ['search_console', 'rank_tracking', 'site_audit'] }),
      );
    });

    it('puts the cursor in Recipients when "Email it when ready" is ticked', async () => {
      serve();
      renderPage();
      await userEvent.click(await screen.findByRole('button', { name: 'Generate report' }));
      const drawer = await screen.findByRole('dialog', { name: 'Generate report' });
      await userEvent.click(within(drawer).getByRole('checkbox', { name: /Email it when ready/ }));
      await waitFor(() => expect(within(drawer).getByLabelText('Recipients')).toHaveFocus());
    });

    it('validates a custom range, the sections and the recipients', async () => {
      serve();
      renderPage();
      await userEvent.click(await screen.findByRole('button', { name: 'Generate report' }));
      const drawer = await screen.findByRole('dialog', { name: 'Generate report' });

      await userEvent.click(within(drawer).getByRole('radio', { name: /Custom range/ }));
      for (const s of ['Search Console', 'Rank tracking', 'Site audit']) await userEvent.click(within(drawer).getByRole('checkbox', { name: new RegExp(s) }));
      await userEvent.click(within(drawer).getByRole('checkbox', { name: /Email it when ready/ }));
      await userEvent.click(within(drawer).getByRole('button', { name: 'Generate report' }));

      expect(await within(drawer).findByText('Choose the first day.')).toBeInTheDocument();
      expect(within(drawer).getByText('Choose the last day.')).toBeInTheDocument();
      expect(within(drawer).getByText('Choose at least one section.')).toBeInTheDocument();
      expect(within(drawer).getByText('Add at least one email address.')).toBeInTheDocument();

      await userEvent.type(within(drawer).getByLabelText('First day'), '10/10/2026');
      await userEvent.type(within(drawer).getByLabelText('Last day'), '01/10/2026');
      await userEvent.click(within(drawer).getByRole('checkbox', { name: /Site audit/ }));
      const recipients = within(drawer).getByLabelText('Recipients');
      await userEvent.type(recipients, 'not-an-email{Enter}');
      expect(within(drawer).getByText('“not-an-email” isn\'t a valid email address.')).toBeInTheDocument();
      await userEvent.clear(recipients);
      await userEvent.type(recipients, 'thandi@karoocoffee.co.za{Enter}');
      expect(within(drawer).getByRole('button', { name: 'Remove thandi@karoocoffee.co.za' })).toBeInTheDocument();

      await userEvent.click(within(drawer).getByRole('button', { name: 'Generate report' }));
      expect(await within(drawer).findByText('The last day must be on or after the first.')).toBeInTheDocument();
      expect(api.generateReport).not.toHaveBeenCalled();

      await userEvent.clear(within(drawer).getByLabelText('Last day'));
      await userEvent.type(within(drawer).getByLabelText('Last day'), '31/10/2026');
      vi.mocked(api.generateReport).mockResolvedValue(row({ id: 43, status: 'generating' }));
      await userEvent.click(within(drawer).getByRole('button', { name: 'Generate report' }));
      await waitFor(() =>
        expect(api.generateReport).toHaveBeenCalledWith(7, {
          period: 'custom',
          start: '2026-10-10',
          end: '2026-10-31',
          compare: 'previous',
          sections: ['site_audit'],
          sendTo: ['thandi@karoocoffee.co.za'],
        }),
      );
    });

    it('binds the API’s 422 to the field', async () => {
      serve();
      renderPage();
      await userEvent.click(await screen.findByRole('button', { name: 'Generate report' }));
      const drawer = await screen.findByRole('dialog', { name: 'Generate report' });
      vi.mocked(api.generateReport).mockRejectedValue(apiError(422, { message: 'Invalid', errors: { 'sections.0': ['Search Console is not connected for this site.'] } }));
      await userEvent.click(within(drawer).getByRole('button', { name: 'Generate report' }));
      expect(await within(drawer).findByText('Search Console is not connected for this site.')).toBeInTheDocument();
    });

    it('polls a generating report until it is ready, then says so', async () => {
      vi.mocked(api.getReportSites).mockResolvedValue([site()]);
      vi.mocked(api.getSchedule).mockResolvedValue(schedule());
      vi.mocked(api.getSiteReports)
        .mockResolvedValueOnce(page([row({ status: 'generating', summary: [] })]))
        .mockResolvedValue(page([row()]));
      renderPage();

      const r = await findRow('SEO report · October 2026');
      expect(r).toHaveTextContent('Generating…');
      await waitFor(() => expect(within(table()).getByText('Ready')).toBeInTheDocument(), { timeout: 6_000 });
      expect(api.getSiteReports).toHaveBeenCalledTimes(2);
      expect(showToaster).toHaveBeenCalledWith('success', '“SEO report · October 2026” is ready.');
    });

    it('re-reads the list after a report is ready, so an "email when ready" shows as sent', async () => {
      vi.mocked(api.getReportSites).mockResolvedValue([site()]);
      vi.mocked(api.getSchedule).mockResolvedValue(schedule());
      vi.mocked(api.getSiteReports)
        .mockResolvedValueOnce(page([row({ status: 'generating', summary: [] })]))
        .mockResolvedValueOnce(page([row()]))
        .mockResolvedValue(page([row({ sentAt: '2026-11-20T18:05:23+02:00', sentTo: ['mm@mm.com'] })]));
      renderPage();

      await waitFor(() => expect(within(table()).getByText('Ready')).toBeInTheDocument(), { timeout: 6_000 });
      expect(within(table()).getByText('Not sent')).toBeInTheDocument();
      await waitFor(() => expect(within(table()).getByText('mm@mm.com')).toBeInTheDocument(), { timeout: 8_000 });
      expect(api.getSiteReports).toHaveBeenCalledTimes(3);
    }, 15_000);
  });

  describe('send now', () => {
    it("generates last month's report for the schedule's recipients after a confirmation", async () => {
      serve();
      vi.mocked(api.sendScheduleNow).mockResolvedValue(row({ id: 77, status: 'generating', title: 'Karoo Coffee · SEO report · October 2026' }));
      renderPage();

      const strip = await screen.findByRole('region', { name: 'Monthly report' });
      await userEvent.click(within(strip).getByRole('button', { name: 'Send now' }));
      const dialog = await screen.findByRole('alertdialog');
      expect(dialog).toHaveTextContent('thandi@karoocoffee.co.za, ops@karoocoffee.co.za');
      expect(dialog).toHaveTextContent('The monthly report still goes out on its usual day.');
      expect(api.sendScheduleNow).not.toHaveBeenCalled();

      await userEvent.click(within(dialog).getByRole('button', { name: 'Send now' }));
      await waitFor(() => expect(api.sendScheduleNow).toHaveBeenCalledWith(7));
      expect(showToaster).toHaveBeenCalledWith('success', 'Generating “Karoo Coffee · SEO report · October 2026”. It will be emailed as soon as it\'s ready.');
    });

    it('is not offered to view-only users or without a schedule', async () => {
      permissions.list = CLIENT;
      serve();
      renderPage();
      const strip = await screen.findByRole('region', { name: 'Monthly report' });
      expect(within(strip).queryByRole('button', { name: 'Send now' })).not.toBeInTheDocument();
    });
  });

  describe('schedule', () => {
    it('shows the saved schedule with its next run, and checks the day and recipients', async () => {
      serve();
      renderPage();
      await userEvent.click(await screen.findByRole('button', { name: 'Schedule' }));
      const drawer = await screen.findByRole('dialog', { name: 'Monthly report' });

      expect(await within(drawer).findByTestId('next-run')).toHaveTextContent('Next report: 1 December 2026 at 08:00');
      expect(within(drawer).getByRole('button', { name: 'Remove thandi@karoocoffee.co.za' })).toBeInTheDocument();

      // The day: 1–28 only.
      await userEvent.click(within(drawer).getByRole('combobox', { name: 'Day of the month' }));
      const options = await screen.findAllByRole('option');
      expect(options).toHaveLength(28);
      expect(options[27]).toHaveTextContent('The 28th');
      await userEvent.click(screen.getByRole('option', { name: 'The 15th' }));
      expect(within(drawer).getByTestId('next-run')).toHaveTextContent(`Next report: ${nextRunLabel(15)}`);

      // The time: on the hour, 00:00–23:00 (South African time).
      await userEvent.click(within(drawer).getByRole('combobox', { name: 'Time' }));
      const hours = await screen.findAllByRole('option');
      expect(hours).toHaveLength(24);
      expect(hours[0]).toHaveTextContent('00:00');
      await userEvent.click(screen.getByRole('option', { name: '17:00' }));
      expect(within(drawer).getByTestId('next-run')).toHaveTextContent(`Next report: ${nextRunLabel(15, undefined, 17)}`);

      // Recipients: at least one…
      await userEvent.click(within(drawer).getByRole('button', { name: 'Remove thandi@karoocoffee.co.za' }));
      await userEvent.click(within(drawer).getByRole('button', { name: 'Remove ops@karoocoffee.co.za' }));
      await userEvent.click(within(drawer).getByRole('button', { name: 'Save schedule' }));
      expect(await within(drawer).findByText('Add at least one email address.')).toBeInTheDocument();
      expect(api.saveSchedule).not.toHaveBeenCalled();

      // …at most ten.
      const input = within(drawer).getByLabelText('Recipients');
      await userEvent.click(input);
      await userEvent.paste(Array.from({ length: 11 }, (_, i) => `p${i}@client.co.za`).join(', '));
      expect(within(drawer).getByText('10 of 10')).toBeInTheDocument();
      expect(within(drawer).getByText('Add at most 10 email addresses.')).toBeInTheDocument();

      vi.mocked(api.saveSchedule).mockResolvedValue(schedule({ dayOfMonth: 15 }));
      await userEvent.click(within(drawer).getByRole('button', { name: 'Save schedule' }));
      await waitFor(() =>
        expect(api.saveSchedule).toHaveBeenCalledWith(7, {
          isActive: true,
          dayOfMonth: 15,
          sendHour: 17,
          recipients: Array.from({ length: 10 }, (_, i) => `p${i}@client.co.za`),
          sections: ['search_console', 'rank_tracking', 'site_audit'],
          compare: 'previous',
          note: null,
        }),
      );
    });

    it('turns the schedule off, keeping its recipients for later', async () => {
      serve([row()], schedule({ isActive: true }));
      renderPage();
      await userEvent.click(await screen.findByRole('button', { name: 'Schedule' }));
      const drawer = await screen.findByRole('dialog', { name: 'Monthly report' });
      const toggle = await within(drawer).findByRole('switch', { name: 'Send a report every month' });
      await waitFor(() => expect(toggle).toBeChecked());
      await userEvent.click(toggle);
      expect(within(drawer).queryByTestId('next-run')).not.toBeInTheDocument();
      vi.mocked(api.saveSchedule).mockResolvedValue(schedule({ isActive: false }));
      await userEvent.click(within(drawer).getByRole('button', { name: 'Save schedule' }));
      await waitFor(() => expect(api.saveSchedule).toHaveBeenCalledWith(7, expect.objectContaining({ isActive: false, recipients: schedule().recipients })));
      expect(showToaster).toHaveBeenCalledWith('success', 'Monthly report turned off.');
    });
  });

  describe('row actions', () => {
    const writeText = vi.fn();
    beforeEach(() => {
      writeText.mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    });
    afterEach(() => {
      Reflect.deleteProperty(navigator, 'clipboard');
    });

    it('creates a share link with the chosen expiry, then copies it', async () => {
      serve();
      renderPage();
      const r = await findRow('SEO report · October 2026');
      expect(await openMenu(r)).toEqual(['View', 'Download PDF', 'Create share link', 'Send by email', 'Delete']);
      await userEvent.click(screen.getByRole('menuitem', { name: 'Create share link' }));
      vi.mocked(api.shareReport).mockResolvedValue(row({ share: { url: 'http://localhost:5173/r/tok123', expiresAt: '2027-02-18T00:00:00+02:00' } }));
      await pick('Expires in 90 days');

      await waitFor(() => expect(api.shareReport).toHaveBeenCalledWith(41, 90));
      await waitFor(() => expect(writeText).toHaveBeenCalledWith('http://localhost:5173/r/tok123'));
      expect(showToaster).toHaveBeenCalledWith('success', 'Share link created and copied.');
    });

    it('copies an existing link straight away', async () => {
      serve([row({ share: { url: 'http://localhost:5173/r/abc', expiresAt: null } })]);
      renderPage();
      const r = await findRow('SEO report · October 2026');
      expect(await openMenu(r)).toEqual(['View', 'Download PDF', 'Copy share link', 'Revoke share link', 'Send by email', 'Delete']);
      await pick('Copy share link');
      await waitFor(() => expect(writeText).toHaveBeenCalledWith('http://localhost:5173/r/abc'));
      expect(api.shareReport).not.toHaveBeenCalled();
      expect(showToaster).toHaveBeenCalledWith('success', 'Share link copied.');
    });

    it('revokes a link after confirming', async () => {
      serve([row({ share: { url: 'http://localhost:5173/r/abc', expiresAt: null } })]);
      renderPage();
      const r = await findRow('SEO report · October 2026');
      await openMenu(r);
      await pick('Revoke share link');
      const confirm = await screen.findByRole('alertdialog', { name: 'Revoke the share link?' });
      vi.mocked(api.revokeShare).mockResolvedValue(row());
      await userEvent.click(within(confirm).getByRole('button', { name: 'Revoke link' }));
      await waitFor(() => expect(api.revokeShare).toHaveBeenCalledWith(41));
      await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    });

    it('sends by email, suggesting the schedule’s recipients', async () => {
      serve();
      renderPage();
      const r = await findRow('SEO report · October 2026');
      await openMenu(r);
      await pick('Send by email');
      const drawer = await screen.findByRole('dialog', { name: 'SEO report · October 2026' });
      expect(within(drawer).getByRole('button', { name: 'Remove thandi@karoocoffee.co.za' })).toBeInTheDocument();
      await userEvent.type(within(drawer).getByLabelText('Message (optional)'), 'Here is October.');
      vi.mocked(api.sendReport).mockResolvedValue(row({ sentAt: '2026-11-20T10:00:00+02:00', sentTo: schedule().recipients }));
      await userEvent.click(within(drawer).getByRole('button', { name: 'Send report' }));
      await waitFor(() => expect(api.sendReport).toHaveBeenCalledWith(41, { recipients: ['thandi@karoocoffee.co.za', 'ops@karoocoffee.co.za'], message: 'Here is October.' }));
      expect(showToaster).toHaveBeenCalledWith('success', 'Report sent to 2 people.');
    });

    it('explains a 409 when the report is not ready', async () => {
      serve();
      renderPage();
      const r = await findRow('SEO report · October 2026');
      await openMenu(r);
      await pick('Send by email');
      const drawer = await screen.findByRole('dialog', { name: 'SEO report · October 2026' });
      vi.mocked(api.sendReport).mockRejectedValue(apiError(409, { message: 'The report is not ready yet.', error_type: 'report_not_ready' }));
      await userEvent.click(within(drawer).getByRole('button', { name: 'Send report' }));
      await waitFor(() => expect(showToaster).toHaveBeenCalledWith('error', 'The report is not ready yet.'));
    });

    it('deletes after confirming', async () => {
      serve();
      renderPage();
      const r = await findRow('SEO report · October 2026');
      await openMenu(r);
      await pick('Delete');
      const confirm = await screen.findByRole('alertdialog', { name: 'Delete this report?' });
      vi.mocked(api.deleteReport).mockResolvedValue();
      await userEvent.click(within(confirm).getByRole('button', { name: 'Delete' }));
      await waitFor(() => expect(api.deleteReport).toHaveBeenCalledWith(41));
      expect(showToaster).toHaveBeenCalledWith('success', '“SEO report · October 2026” deleted.');
    });
  });

  describe('bulk actions', () => {
    const SHARE = { url: 'http://localhost:5173/r/abc', expiresAt: null };
    const rows = () => [
      row({ share: SHARE }),
      row({ id: 42, title: 'September report', status: 'failed', summary: [] }),
      row({ id: 43, title: 'November report', status: 'generating', summary: [] }),
    ];

    it('revokes the selected share links, then deletes the selected reports, after confirming', async () => {
      serve(rows());
      renderPage();
      await findRow('SEO report · October 2026');
      expect(screen.queryByRole('region', { name: 'Bulk actions' })).not.toBeInTheDocument();
      // A generating report can't be selected.
      expect(within(table()).queryByRole('checkbox', { name: 'Select November report' })).not.toBeInTheDocument();

      await userEvent.click(within(table()).getByRole('checkbox', { name: 'Select SEO report · October 2026' }));
      await userEvent.click(within(table()).getByRole('checkbox', { name: 'Select September report' }));
      const bar = screen.getByRole('region', { name: 'Bulk actions' });
      expect(bar).toHaveTextContent('2 selected');

      vi.mocked(api.bulkReports).mockResolvedValue({ affected: 1 });
      await userEvent.click(within(bar).getByRole('button', { name: 'Revoke share links (1)' }));
      const revoke = await screen.findByRole('alertdialog', { name: 'Revoke the share link?' });
      await userEvent.click(within(revoke).getByRole('button', { name: 'Revoke links' }));
      await waitFor(() => expect(api.bulkReports).toHaveBeenCalledWith(7, 'unshare', [41]));
      expect(showToaster).toHaveBeenCalledWith('success', '1 share link revoked.');
      await waitFor(() => expect(screen.queryByRole('region', { name: 'Bulk actions' })).not.toBeInTheDocument());

      await userEvent.click(within(table()).getByRole('checkbox', { name: 'Select all reports on this page' }));
      vi.mocked(api.bulkReports).mockResolvedValue({ affected: 2 });
      await userEvent.click(within(screen.getByRole('region', { name: 'Bulk actions' })).getByRole('button', { name: 'Delete' }));
      const confirm = await screen.findByRole('alertdialog', { name: 'Delete 2 reports?' });
      await userEvent.click(within(confirm).getByRole('button', { name: 'Delete' }));
      await waitFor(() => expect(api.bulkReports).toHaveBeenCalledWith(7, 'delete', [41, 42]));
      expect(showToaster).toHaveBeenCalledWith('success', '2 reports deleted.');
    });

    it('offers revoke only when a selected report is shared, and delete only with delete_reports', async () => {
      permissions.list = ['view_reports', 'create_reports'];
      serve(rows());
      renderPage();
      await findRow('September report');
      await userEvent.click(within(table()).getByRole('checkbox', { name: 'Select September report' }));
      const bar = screen.getByRole('region', { name: 'Bulk actions' });
      expect(within(bar).getByRole('button', { name: 'Revoke share links' })).toBeDisabled();
      expect(within(bar).queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    });

    it('has no checkboxes for view-only users', async () => {
      permissions.list = CLIENT;
      serve(rows());
      renderPage();
      await findRow('September report');
      expect(within(table()).queryByRole('checkbox')).not.toBeInTheDocument();
    });

    it('says why a bulk action failed and keeps the selection', async () => {
      serve(rows());
      renderPage();
      await findRow('September report');
      await userEvent.click(within(table()).getByRole('checkbox', { name: 'Select September report' }));
      vi.mocked(api.bulkReports).mockRejectedValue(apiError(422, { message: 'Some of the selected reports no longer exist. Refresh and try again.' }));
      await userEvent.click(within(screen.getByRole('region', { name: 'Bulk actions' })).getByRole('button', { name: 'Delete' }));
      await userEvent.click(within(await screen.findByRole('alertdialog', { name: 'Delete 1 report?' })).getByRole('button', { name: 'Delete' }));
      await waitFor(() => expect(showToaster).toHaveBeenCalledWith('error', 'Some of the selected reports no longer exist. Refresh and try again.'));
      // The confirmation stays open to try again; the selection is kept behind it.
      expect(screen.getByRole('alertdialog', { name: 'Delete 1 report?' })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: 'Bulk actions', hidden: true })).toHaveTextContent('1 selected');
    });
  });
});
