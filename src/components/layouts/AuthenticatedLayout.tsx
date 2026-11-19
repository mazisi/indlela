import { useCallback, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { AppToaster } from '@/components/AppToaster';
import Topbar from '../dashboard/Topbar';
import { Sidebar } from '../dashboard/Sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useResetTitleOnNavigate } from '@/hooks/useDocumentTitle';

const COLLAPSE_KEY = 'indlela_sidebar_collapsed';

export default function AuthenticatedLayout() {
  // The mobile drawer is open *for a given page*: navigating anywhere else
  // closes it without an effect.
  const { pathname } = useLocation();
  const [drawerOpenAt, setDrawerOpenAt] = useState<string | null>(null);
  const sidebarOpen = drawerOpenAt === pathname;
  // useCallback so the memoised Sidebar isn't re-rendered by a fresh closure.
  const toggleSidebar = useCallback(
    () => setDrawerOpenAt((openAt) => (openAt === pathname ? null : pathname)),
    [pathname],
  );

  // Desktop-only collapse to an icon rail, persisted across reloads.
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const toggleCollapse = useCallback(() => {
    setSidebarCollapsed((prev) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, String(!prev));
      } catch {
        /* ignore persistence failures (private mode, sandbox, etc.) */
      }
      return !prev;
    });
  }, []);

  // A page that renders no <Head> must not keep the last one's title.
  useResetTitleOnNavigate();

  return (
    <TooltipProvider delayDuration={200}>
      {/* Printing shows the page alone, all of it: no sidebar or top bar, and no scroll box cutting it at one sheet. */}
      <div className="flex h-dvh flex-col overflow-hidden bg-background print:block print:h-auto print:overflow-visible print:bg-white">
        <div className="contents print:hidden">
          <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} isCollapsed={sidebarCollapsed} onToggleCollapse={toggleCollapse} />
        </div>

        <div className={`flex flex-1 flex-col overflow-hidden transition-[margin] duration-300 print:ml-0 print:block print:overflow-visible ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-[256px]'}`}>
          <div className="contents print:hidden">
            <Topbar onToggleSidebar={toggleSidebar} />
          </div>
          <main className="flex-1 overflow-y-auto focus:outline-none print:overflow-visible">
            <Outlet />
          </main>
        </div>

        <AppToaster />
      </div>
    </TooltipProvider>
  );
}
