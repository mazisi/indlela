import { memo, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { ChevronsLeft, ChevronsRight, X } from 'lucide-react';
import { BrandMark } from '@/components/BrandMark';
import { Skeleton } from '@/components/ui/skeleton';
import { usePermissions } from '@/contexts/PermissionContextType';
import { moduleHref } from '@/config/modules';
import { cn } from '@/lib/utils';
import { WorkspaceSwitcher } from '../layouts/sidebar/WorkspaceSwitcher';
import { MenuSearch } from '../layouts/sidebar/MenuSearch';
import { NavGroup } from '../layouts/sidebar/NavGroup';
import { filterMenu } from '../layouts/sidebar/filterMenu';
import { SidebarUserCard } from '../layouts/sidebar/SidebarUserCard';
import { useNavCounts } from '../layouts/sidebar/useNavCounts';
import { useVisibleMenu } from '../layouts/sidebar/useVisibleMenu';
import { version } from '../../../package.json';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

/**
 * The sidebar (ported from workforce-app): brand, workspace switcher, the menu (expandable sections with badges), the
 * signed-in user with My account / Sign out, and the app's version (bumped
 * by every build, so it says which build is live).
 * Collapses to an icon rail on desktop; slides in as a drawer on mobile.
 */
export const Sidebar = memo(function Sidebar({ isOpen, toggleSidebar, isCollapsed, onToggleCollapse }: SidebarProps) {
  const { loading } = usePermissions();
  const fullMenu = useVisibleMenu();
  const counts = useNavCounts();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Searching narrows the menu and opens every section left; opening a page
  // clears the search.
  const [query, setQuery] = useState('');
  const [searchedFrom, setSearchedFrom] = useState(pathname);
  const searching = query.trim() !== '';
  const menu = filterMenu(fullMenu, query);
  const openFirstMatch = () => {
    const first = menu[0];
    if (first) navigate(first.items.length > 0 ? moduleHref(first.module, first.items[0]) : moduleHref(first.module));
  };

  // One section open at a time (an accordion): the one holding the current
  // page, until the user opens another (null: all closed).
  const [chosen, setChosen] = useState<string | null>();
  const isOpenSection = (key: string, href: string) => (chosen === undefined ? pathname === href || pathname.startsWith(`${href}/`) : chosen === key);

  // Opening a page shows only its own section again; one opened from a search clears the search.
  if (searchedFrom !== pathname) {
    setSearchedFrom(pathname);
    setChosen(undefined);
    if (query) setQuery('');
  }

  // On mobile the drawer is always full width, whatever the desktop setting.
  const collapsed = isCollapsed && !isOpen;

  // The current page stays in view in a long menu: after a reload, on going to another page,
  // on opening the drawer, and when a search ends. Only as far as needed, so nothing visible jumps.
  const navRef = useRef<HTMLElement>(null);
  const menuReady = fullMenu.length > 0;
  useEffect(() => {
    if (menuReady && !searching) navRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView?.({ block: 'nearest' });
  }, [pathname, menuReady, searching, collapsed, isOpen]);

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={toggleSidebar} aria-hidden />}

      <aside
        aria-label="Main menu"
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[256px] flex-col border-r bg-sidebar transition-[width,transform] duration-300 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          collapsed && 'lg:w-16',
        )}
      >
        <div className={cn('flex shrink-0 items-center justify-between px-4 pb-3 pt-4', collapsed && 'lg:justify-center lg:px-0')}>
          <BrandMark compact={collapsed} />
          <button type="button" onClick={toggleSidebar} className="rounded p-1 text-muted-foreground hover:bg-secondary lg:hidden" aria-label="Close menu">
            <X className="size-5" />
          </button>
        </div>

        <div className={cn('shrink-0 px-4 pb-3', collapsed && 'lg:px-0')}>
          <WorkspaceSwitcher collapsed={collapsed} />
          {!collapsed && (
            <div className="mt-2.5">
              <MenuSearch value={query} onChange={setQuery} onSubmit={openFirstMatch} />
            </div>
          )}
        </div>

        <nav ref={navRef} className={cn('min-h-0 flex-1 overflow-y-auto px-3 pb-3', collapsed && 'lg:px-2')}>
          {loading && fullMenu.length === 0 ? (
            <div className="space-y-1.5 px-1 pt-1">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2.5 px-2 py-2">
                  <Skeleton className="size-[18px] rounded" />
                  <Skeleton className="h-3.5 w-28 rounded" />
                </div>
              ))}
            </div>
          ) : searching && menu.length === 0 ? (
            <p className="px-2.5 py-3 text-[13px] text-muted-foreground" role="status">
              No pages match &ldquo;{query.trim()}&rdquo;.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {menu.map(({ module, items }) => {
                const href = moduleHref(module);
                const open = !collapsed && (searching || isOpenSection(module.key, href));
                return (
                  <li key={module.key}>
                    <NavGroup
                      module={module}
                      items={items}
                      counts={counts}
                      collapsed={collapsed}
                      open={open}
                      onToggle={() => !searching && setChosen(open ? null : module.key)}
                      scrollOnOpen={!searching}
                      query={query}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </nav>

        <div className={cn('shrink-0 border-t px-4 py-3', collapsed && 'lg:px-1')}>
          <SidebarUserCard collapsed={collapsed} />
          <p className={cn('mt-2.5 text-2xs text-muted-foreground', collapsed && 'text-center')} title={`Version ${version}`}>
            {collapsed ? `v${version}` : `Version ${version}`}
          </p>
        </div>

        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden h-9 shrink-0 items-center gap-2 border-t px-4 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground lg:flex"
          aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
        >
          {collapsed ? (
            <ChevronsRight className="mx-auto size-4" />
          ) : (
            <>
              <ChevronsLeft className="size-4" /> Collapse
            </>
          )}
        </button>
      </aside>
    </>
  );
});
