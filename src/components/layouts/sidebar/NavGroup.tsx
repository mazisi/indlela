import { useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { moduleHref, type ModuleDef, type SubItem } from '@/config/modules';
import { cn } from '@/lib/utils';
import { Highlight } from './Highlight';
import { NavBadge } from './NavBadge';
import { moduleBadge, type NavCounts } from './useNavCounts';

interface NavGroupProps {
  module: ModuleDef;
  /** The sub-items this user may open (already permission-filtered). */
  items: SubItem[];
  counts: NavCounts;
  collapsed: boolean;
  open: boolean;
  onToggle: () => void;
  /** Bring the section's pages into view when it opens (off while searching). */
  scrollOnOpen?: boolean;
  /** The menu search, marked in the labels. */
  query?: string;
}

const rowBase =
  'flex w-full items-center gap-2.5 rounded px-2.5 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring';
const rowActive = 'bg-sidebar-accent font-semibold text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground';

/**
 * One top-level menu: a plain link, or (with sub-items) a disclosure button
 * whose items sit in an indented list with a guide line — as in workforce-app.
 */
export function NavGroup({ module: m, items, counts, collapsed, open, onToggle, scrollOnOpen = true, query = '' }: NavGroupProps) {
  const { pathname } = useLocation();
  const groupRef = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(open);

  // When a section is opened (not when it starts open with the current page),
  // scroll just enough to show its pages: a section near the bottom of a long
  // menu otherwise opens out of sight.
  useEffect(() => {
    if (open && !wasOpen.current && scrollOnOpen) groupRef.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
    wasOpen.current = open;
  }, [open, scrollOnOpen]);

  const Icon = m.icon;
  const href = moduleHref(m);
  const active = m.path === '' ? pathname === '/dashboard' : pathname === href || pathname.startsWith(`${href}/`);
  const badge = moduleBadge(counts, m.key, items.map((i) => i.key));
  const target = items.length > 0 ? moduleHref(m, items[0]) : href;

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link to={target} className={cn(rowBase, 'relative justify-center px-0', active && rowActive)} aria-label={m.label} aria-current={active ? 'page' : undefined}>
            <Icon className="size-[18px] shrink-0" aria-hidden />
            {badge && (
              <span className={cn('absolute right-2 top-1.5 size-2 rounded-full', badge.tone === 'bad' ? 'bg-bad' : 'bg-muted-foreground')} aria-hidden />
            )}
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">
          {m.label}
          {badge ? ` · ${badge.count}` : ''}
        </TooltipContent>
      </Tooltip>
    );
  }

  if (items.length === 0) {
    return (
      <NavLink to={href} end={m.path === ''} className={cn(rowBase, active && rowActive)}>
        <Icon className="size-[18px] shrink-0" aria-hidden />
        <span className="min-w-0 flex-1 truncate">
          <Highlight text={m.label} query={query} />
        </span>
        <NavBadge badge={badge} />
      </NavLink>
    );
  }

  const listId = `nav-${m.key}`;

  return (
    <div ref={groupRef} className="scroll-my-2">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={listId}
        className={cn(rowBase, active && !open && rowActive, active && open && 'text-foreground')}
      >
        <Icon className="size-[18px] shrink-0" aria-hidden />
        <span className="min-w-0 flex-1 truncate text-left">
          <Highlight text={m.label} query={query} />
        </span>
        {!open && <NavBadge badge={badge} />}
        <ChevronRight className={cn('size-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-90')} aria-hidden />
      </button>
      {open && (
        <ul id={listId} className="mb-1.5 ml-[18px] mt-0.5 space-y-px border-l pl-2.5">
          {items.map((item) => (
            <li key={item.key}>
              <NavLink
                to={moduleHref(m, item)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded px-2.5 py-1.5 text-[13px] text-sidebar-foreground transition-colors hover:bg-secondary hover:text-foreground',
                    isActive && 'bg-sidebar-accent font-semibold text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  )
                }
              >
                <span className="min-w-0 flex-1">
                  <Highlight text={item.label} query={query} />
                </span>
                <NavBadge badge={counts[`${m.key}.${item.key}`] ?? null} />
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
