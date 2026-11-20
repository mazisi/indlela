import { Suspense } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useLocation, useRoutes } from 'react-router';
import { apiError } from '@/test/renderWithProviders';
import routes from '@/routes';
import * as api from '../api/publicReportsApi';
import { INK_DARK, INK_LIGHT } from '../lib/brand';
import { publicReport, snapshot } from '../test/fixtures';

vi.mock('../api/publicReportsApi', () => ({
  getPublicReport: vi.fn(),
  publicPdfUrl: (token: string) => `http://localhost:8000/api/public/reports/${token}/pdf`,
}));

function Where() {
  return <p data-testid="location">{useLocation().pathname}</p>;
}

/** The app's real routes, signed out: the share link must render, never redirect to /login. */
function App() {
  return (
    <>
      {useRoutes(routes)}
      <Where />
    </>
  );
}

const renderShare = (token = 'tok123') => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/r/${token}`]}>
        <Suspense fallback={<p>Loading…</p>}>
          <App />
        </Suspense>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('PublicReportPage (/r/:token)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    document.title = 'Indlela';
  });
  afterEach(() => {
    document.head.querySelectorAll('meta[name="robots"]').forEach((m) => m.remove());
  });

  it('is reachable without a session and shows only the agency’s branding', async () => {
    vi.mocked(api.getPublicReport).mockResolvedValue(publicReport());
    renderShare();

    // The lazy route chunk loads first: slow on a busy machine.
    const header = await screen.findByTestId('report-header', {}, { timeout: 8_000 });
    expect(screen.getByTestId('location')).toHaveTextContent('/r/tok123');
    expect(api.getPublicReport).toHaveBeenCalledWith('tok123');
    expect(within(header).getByTestId('agency-name')).toHaveTextContent('Sandton Digital');
    expect(within(header).getByRole('img', { name: 'Sandton Digital logo' })).toHaveAttribute('src', 'https://cdn.example/logo.png');
    expect(within(header).getByRole('heading', { level: 1, name: 'SEO report · October 2026' })).toBeInTheDocument();
    expect(header).toHaveTextContent('Karoo Coffee (Pty) Ltd · Karoo Coffee');

    const view = screen.getByTestId('report-view');
    expect(view).toHaveAttribute('data-brand', '#0b6e4f');
    expect(view).toHaveAttribute('data-ink', INK_LIGHT);
    expect(view.style.getPropertyValue('--brand')).toBe('#0b6e4f');

    // No app chrome, no Indlela anywhere.
    expect(document.body.textContent).not.toMatch(/indlela/i);
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(document.title).toBe('SEO report · October 2026 · Sandton Digital');
    expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');

    expect(screen.getByRole('link', { name: 'Download PDF' })).toHaveAttribute('href', 'http://localhost:8000/api/public/reports/tok123/pdf');
  });

  it('chooses dark text on a light brand colour', async () => {
    vi.mocked(api.getPublicReport).mockResolvedValue(publicReport({ branding: { name: 'Sunny Agency', logoUrl: null, brandColor: '#ffd400' } }));
    renderShare();
    const view = await screen.findByTestId('report-view', {}, { timeout: 8_000 });
    expect(view).toHaveAttribute('data-ink', INK_DARK);
    // The pale colour is darkened where it draws on white.
    expect(view.style.getPropertyValue('--brand-accent')).not.toBe('#ffd400');
    // No logo: the agency's initial.
    expect(within(screen.getByTestId('report-header')).queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByTestId('agency-name')).toHaveTextContent('Sunny Agency');
  });

  it('shows the summary first, the note and every section', async () => {
    vi.mocked(api.getPublicReport).mockResolvedValue(publicReport());
    renderShare();

    const glance = await screen.findByRole('region', { name: 'At a glance' }, { timeout: 8_000 });
    expect(within(glance).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Traffic up 14%', '6 keywords entered the top 10', '2 issues need attention']);
    expect(screen.getByRole('region', { name: 'A note from Sandton Digital' })).toHaveTextContent('Great month');

    const sc = screen.getByRole('region', { name: 'Search Console' });
    const tiles = within(sc).getByRole('group', { name: 'Search performance' });
    expect(within(tiles).getByText('1,140')).toBeInTheDocument();
    expect(within(tiles).getByRole('img', { name: 'Clicks up 14.0% vs September 2026' })).toHaveAttribute('data-tone', 'good');
    expect(within(sc).getAllByText('coffee beans johannesburg').length).toBeGreaterThan(0);
    expect(within(sc).getByText('+85 clicks possible')).toBeInTheDocument();

    const rank = screen.getByRole('region', { name: 'Rank tracking' });
    expect(within(rank).getByText('In the top 10').parentElement).toHaveTextContent('14');
    expect(within(rank).getByRole('region', { name: 'Entered the top 10' })).toHaveTextContent('coffee subscription');
    expect(within(rank).getByRole('region', { name: 'Biggest drops' })).toHaveTextContent('decaf coffee');

    const audit = screen.getByRole('region', { name: 'Site audit' });
    expect(within(audit).getByRole('img', { name: 'Health score 82 out of 100: Good' })).toBeInTheDocument();
    expect(within(audit).getByText('Broken internal links')).toBeInTheDocument();
    expect(within(audit).getByText(/Update or remove the links/)).toBeInTheDocument();
  });

  it('says plainly when a section has no figures, and leaves out sections not chosen', async () => {
    vi.mocked(api.getPublicReport).mockResolvedValue(
      publicReport({ data: snapshot({ searchConsole: { available: false, reason: 'Search Console is not connected for this site.' }, siteAudit: undefined }) }),
    );
    renderShare();

    const sc = await screen.findByRole('region', { name: 'Search Console' }, { timeout: 8_000 });
    expect(sc).toHaveTextContent('Search Console is not connected for this site.');
    expect(within(sc).queryByRole('group')).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Site audit' })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Rank tracking' })).toBeInTheDocument();
  });

  it('shows a neutral message for an expired or unknown link', async () => {
    vi.mocked(api.getPublicReport).mockRejectedValue(apiError(404, { message: 'Not found.' }));
    renderShare('old');

    expect(await screen.findByRole('heading', { name: 'This report link is no longer available' }, { timeout: 8_000 })).toBeInTheDocument();
    expect(screen.getByText('Ask your agency for a new one.')).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/indlela|sign in|log in/i);
    expect(screen.getByTestId('location')).toHaveTextContent('/r/old');
    expect(document.title).toBe('Report unavailable');
  });
});
