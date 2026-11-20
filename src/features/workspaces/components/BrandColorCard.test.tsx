import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { apiError, renderAt } from '@/test/renderWithProviders';
import type { WorkspaceRef } from '@/features/auth/types';
import { INK_DARK, INK_LIGHT } from '@/features/reports/lib/brand';
import * as api from '../api/workspaceApi';
import { BrandColorCard } from './BrandColorCard';

vi.mock('../api/workspaceApi');
vi.mock('@/utils/showToaster', () => ({ default: vi.fn() }));

const workspace: WorkspaceRef = { id: 1, name: 'Sandton Digital', slug: 'sandton-digital', logoUrl: null, brandColor: null };
const renderCard = (canUpdate = true, ws = workspace) => renderAt('/', [{ path: '/', element: <BrandColorCard workspace={ws} canUpdate={canUpdate} /> }]);

describe('BrandColorCard', () => {
  beforeEach(() => vi.resetAllMocks());

  it('rejects anything but a six-digit hex colour', async () => {
    renderCard();
    const hex = screen.getByLabelText('Hex colour');
    await userEvent.type(hex, 'blue');
    await userEvent.click(screen.getByRole('button', { name: 'Save colour' }));
    expect(await screen.findByText('Use a hex colour with six digits, e.g. #1f4e79.')).toBeInTheDocument();
    expect(api.updateWorkspace).not.toHaveBeenCalled();
  });

  it('previews the header in the colour with readable text, and saves it in lower case', async () => {
    vi.mocked(api.updateWorkspace).mockResolvedValue({ ...workspace, brandColor: '#ffd400' });
    renderCard();
    expect(screen.getByTestId('brand-preview')).toHaveAttribute('data-ink', INK_LIGHT);

    await userEvent.type(screen.getByLabelText('Hex colour'), 'FFD400');
    expect(screen.getByTestId('brand-preview')).toHaveAttribute('data-ink', INK_DARK);
    await userEvent.click(screen.getByRole('button', { name: 'Save colour' }));
    await waitFor(() => expect(vi.mocked(api.updateWorkspace).mock.calls[0]?.[0]).toEqual({ brandColor: '#ffd400' }));
  });

  it('follows the colour picker', async () => {
    renderCard();
    fireEvent.input(screen.getByLabelText('Pick a colour'), { target: { value: '#0b6e4f' } });
    expect(screen.getByLabelText('Hex colour')).toHaveValue('#0b6e4f');
  });

  it('resets to the default (null)', async () => {
    vi.mocked(api.updateWorkspace).mockResolvedValue({ ...workspace, brandColor: null });
    renderCard(true, { ...workspace, brandColor: '#0b6e4f' });
    await userEvent.click(screen.getByRole('button', { name: 'Use the default' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save colour' }));
    await waitFor(() => expect(vi.mocked(api.updateWorkspace).mock.calls[0]?.[0]).toEqual({ brandColor: null }));
  });

  it('binds the API’s 422', async () => {
    vi.mocked(api.updateWorkspace).mockRejectedValue(apiError(422, { message: 'Invalid', errors: { brand_color: ['The brand colour must be a hex colour.'] } }));
    renderCard();
    await userEvent.type(screen.getByLabelText('Hex colour'), '#123456');
    await userEvent.click(screen.getByRole('button', { name: 'Save colour' }));
    expect(await screen.findByText('The brand colour must be a hex colour.')).toBeInTheDocument();
  });

  it('is read-only without update permission', () => {
    renderCard(false);
    expect(screen.getByLabelText('Hex colour')).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Save colour' })).not.toBeInTheDocument();
  });
});
