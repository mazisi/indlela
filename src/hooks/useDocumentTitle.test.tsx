import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, MemoryRouter, Outlet, Route, Routes } from 'react-router';

import { Head } from '@/components/ui/Head';
import { APP_NAME, useResetTitleOnNavigate } from './useDocumentTitle';

/**
 * The tab title used to survive a navigation: Head only ever sets
 * document.title, so a page rendering none kept the previous page's — landing
 * on the Control Panel after signing in left the tab reading "Sign in".
 *
 * The fix relies on React running every layout effect before any passive effect
 * in a commit, so the layout's reset lands before the incoming page's Head.
 * That ordering is the whole mechanism, which is why it is pinned here.
 */
function Layout() {
  useResetTitleOnNavigate();

  return (
    <>
      <nav>
        <Link to="/titled">titled</Link>
        <Link to="/untitled">untitled</Link>
        <Link to="/also-titled">also titled</Link>
      </nav>
      <Outlet />
    </>
  );
}

function Titled() {
  return (
    <>
      <Head title="Titled" />
      <p>titled page</p>
    </>
  );
}

function App({ start }: { start: string }) {
  return (
    <MemoryRouter initialEntries={[start]}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/titled" element={<Titled />} />
          {/* Two routes, one component and one title — the reset still has to
              be overwritten on the second. */}
          <Route path="/also-titled" element={<Titled />} />
          <Route path="/untitled" element={<p>untitled page</p>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('document title', () => {
  beforeEach(() => {
    document.title = 'stale';
  });

  it('sets the page title from Head', async () => {
    render(<App start="/titled" />);

    await screen.findByText('titled page');
    expect(document.title).toBe(`Titled | ${APP_NAME}`);
  });

  it('does not keep the previous title on a page that sets none', async () => {
    render(<App start="/titled" />);
    await screen.findByText('titled page');

    await userEvent.click(screen.getByRole('link', { name: 'untitled' }));

    await screen.findByText('untitled page');
    expect(document.title).toBe(APP_NAME);
  });

  it('restores the title when navigating back to a page that sets one', async () => {
    render(<App start="/untitled" />);
    await screen.findByText('untitled page');

    await userEvent.click(screen.getByRole('link', { name: 'titled' }));

    await screen.findByText('titled page');
    expect(document.title).toBe(`Titled | ${APP_NAME}`);
  });

  it('re-asserts the title when two routes share a component and a title', async () => {
    // The reset fires on the new pathname; without pathname in Head's own
    // dependencies its effect would not re-run and the title would stay cleared.
    render(<App start="/titled" />);
    await screen.findByText('titled page');

    await userEvent.click(screen.getByRole('link', { name: 'also titled' }));

    expect(document.title).toBe(`Titled | ${APP_NAME}`);
  });
});
