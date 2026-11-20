import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { apiError, renderAt } from '@/test/renderWithProviders';
import showToaster from '@/utils/showToaster';
import * as api from '../api/siteAuditApi';
import { site } from '../test/fixtures';
import { AuditSettingsSheet } from './AuditSettingsSheet';
import { auditSettingsSchema } from '../schemas/auditSettingsSchema';

vi.mock('../api/siteAuditApi');
vi.mock('@/utils/showToaster', () => ({ default: vi.fn() }));

const renderSheet = (onOpenChange = vi.fn()) => {
  renderAt('/', [{ path: '/', element: <AuditSettingsSheet site={site()} open onOpenChange={onOpenChange} /> }]);
  return onOpenChange;
};

describe('auditSettingsSchema', () => {
  it('takes 50–5000 whole pages and a known schedule', () => {
    expect(auditSettingsSchema.safeParse({ auditSchedule: 'monthly', auditPageLimit: 50 }).success).toBe(true);
    expect(auditSettingsSchema.safeParse({ auditSchedule: 'off', auditPageLimit: 5000 }).success).toBe(true);
    expect(auditSettingsSchema.safeParse({ auditSchedule: 'weekly', auditPageLimit: 49 }).success).toBe(false);
    expect(auditSettingsSchema.safeParse({ auditSchedule: 'weekly', auditPageLimit: 5001 }).success).toBe(false);
    expect(auditSettingsSchema.safeParse({ auditSchedule: 'weekly', auditPageLimit: 120.5 }).success).toBe(false);
    expect(auditSettingsSchema.safeParse({ auditSchedule: 'daily', auditPageLimit: 500 }).success).toBe(false);
  });
});

describe('AuditSettingsSheet', () => {
  beforeEach(() => vi.resetAllMocks());

  it('shows the current settings and validates the page limit', async () => {
    renderSheet();
    expect(screen.getByRole('radio', { name: /Weekly/ })).toBeChecked();
    const limit = screen.getByRole('spinbutton', { name: 'Page limit' });
    expect(limit).toHaveValue(500);

    await userEvent.clear(limit);
    await userEvent.type(limit, '20');
    await userEvent.click(screen.getByRole('button', { name: 'Save settings' }));
    expect(await screen.findByText('Crawl at least 50 pages.')).toBeInTheDocument();

    await userEvent.clear(limit);
    await userEvent.click(screen.getByRole('button', { name: 'Save settings' }));
    expect(await screen.findByText('Enter the most pages to crawl.')).toBeInTheDocument();

    await userEvent.clear(limit);
    await userEvent.type(limit, '9000');
    await userEvent.click(screen.getByRole('button', { name: 'Save settings' }));
    expect(await screen.findByText('Crawl at most 5,000 pages.')).toBeInTheDocument();
    expect(api.saveAuditSettings).not.toHaveBeenCalled();
  });

  it('saves and closes', async () => {
    vi.mocked(api.saveAuditSettings).mockResolvedValue(site({ auditSchedule: 'monthly', auditPageLimit: 1000 }));
    const onOpenChange = renderSheet();

    await userEvent.click(screen.getByRole('radio', { name: /Monthly/ }));
    const limit = screen.getByRole('spinbutton', { name: 'Page limit' });
    await userEvent.clear(limit);
    await userEvent.type(limit, '1000');
    await userEvent.click(screen.getByRole('button', { name: 'Save settings' }));

    await waitFor(() => expect(api.saveAuditSettings).toHaveBeenCalledWith(7, { auditSchedule: 'monthly', auditPageLimit: 1000 }));
    expect(showToaster).toHaveBeenCalledWith('success', 'Audit settings for Karoo Coffee saved.');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("binds the API's 422 to the field", async () => {
    vi.mocked(api.saveAuditSettings).mockRejectedValue(apiError(422, { message: 'Invalid', errors: { audit_page_limit: ['Your plan allows up to 1000 pages.'] } }));
    const onOpenChange = renderSheet();

    const limit = screen.getByRole('spinbutton', { name: 'Page limit' });
    await userEvent.clear(limit);
    await userEvent.type(limit, '4000');
    await userEvent.click(screen.getByRole('button', { name: 'Save settings' }));

    expect(await screen.findByText('Your plan allows up to 1000 pages.')).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
