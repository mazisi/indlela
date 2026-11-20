import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Building2, ChevronRight, ExternalLink, Globe } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { MODULES, permissionFor, type ModuleKey } from '@/config/modules';
import { usePermissions } from '@/contexts/PermissionContextType';
import { cn } from '@/lib/utils';
import { StickyBar } from './StickyBar';

/** The modules that have a page per site, in the order of the menu. */
export type SiteModuleKey = Extract<ModuleKey, 'search_console' | 'site_audit' | 'rank_tracking' | 'local_grid' | 'reports'>;
const SITE_MODULES: SiteModuleKey[] = ['search_console', 'site_audit', 'rank_tracking', 'local_grid', 'reports'];

/** Where a module shows one site: Search Console is one page with `?site=`, the others have `/:siteId`. */
function siteModulePath(module: SiteModuleKey, siteId: number): string {
  const path = MODULES.find((m) => m.key === module)?.path ?? '';
  return module === 'search_console' ? `/dashboard/${path}?site=${siteId}` : `/dashboard/${path}/${siteId}`;
}

export interface HeaderSite {
  id: number;
  name: string;
  url: string;
  client?: { name: string } | null;
}

interface Props {
  /** The module this page belongs to (the breadcrumb's first step and the active tab). */
  module: SiteModuleKey;
  site: HeaderSite | undefined;
  /** The site list is still loading (otherwise a missing site shows the module's name). */
  loading?: boolean;
  actions?: ReactNode;
}

const domainOf = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '');

/**
 * The header of every per-site page: a breadcrumb (module › client › site)
 * that replaces the back link, the site's mark, name and actions (pinned
 * while the page scrolls, like PageHeader), its domain and client, and tabs
 * to the same site in the other modules the user can open.
 */
export function SitePageHeader({ module, site, loading, actions }: Props) {
  const { hasPermission } = usePermissions();
  const current = MODULES.find((m) => m.key === module);
  const tabs = SITE_MODULES.map((key) => MODULES.find((m) => m.key === key)).filter((m) => m && hasPermission(permissionFor(m)));

  return (
    <div className="space-y-3">
      <nav aria-label="Breadcrumb">
        <ol className="flex min-w-0 flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <li>
            <Link to={`/dashboard/${current?.path ?? ''}`} className="font-medium hover:text-primary">
              {current?.label}
            </Link>
          </li>
          {site?.client && (
            <li className="flex items-center gap-1">
              <ChevronRight className="size-3.5 opacity-60" aria-hidden />
              <span>{site.client.name}</span>
            </li>
          )}
          {site && (
            <li className="flex min-w-0 items-center gap-1">
              <ChevronRight className="size-3.5 opacity-60" aria-hidden />
              <span aria-current="page" className="truncate font-medium text-foreground">
                {site.name}
              </span>
            </li>
          )}
        </ol>
      </nav>

      <StickyBar className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {site ? (
            <span className="grid size-10 shrink-0 place-items-center rounded border border-primary/15 bg-accent text-base font-bold text-primary" aria-hidden>
              {site.name.charAt(0).toUpperCase()}
            </span>
          ) : (
            loading && <Skeleton className="size-10 shrink-0 rounded" />
          )}
          <div className="min-w-0">
            {site || !loading ? (
              <h1 className="truncate text-xl font-semibold leading-tight text-foreground">{site?.name ?? current?.label}</h1>
            ) : (
              <>
                <h1 className="sr-only">Loading…</h1>
                <Skeleton className="h-6 w-48 rounded" />
              </>
            )}
            {site && (
              <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <a href={site.url} target="_blank" rel="noreferrer noopener" className="inline-flex min-w-0 items-center gap-1 hover:text-primary hover:underline" title={site.url}>
                  <Globe className="size-3.5 shrink-0" aria-hidden />
                  <span className="truncate">{domainOf(site.url)}</span>
                  <ExternalLink className="size-3 shrink-0 opacity-70" aria-hidden />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
                {site.client && (
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="size-3.5" aria-hidden />
                    {site.client.name}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        {actions}
      </StickyBar>

      {site && tabs.length > 1 && (
        <nav aria-label={`${site.name} in other modules`} className="-mb-1 border-b">
          <ul className="-mb-px flex gap-1 overflow-x-auto">
            {tabs.map((m) => {
              if (!m) return null;
              const Icon = m.icon;
              const active = m.key === module;
              return (
                <li key={m.key}>
                  <Link
                    to={siteModulePath(m.key as SiteModuleKey, site.id)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors',
                      active ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
                    )}
                  >
                    <Icon className="size-4" aria-hidden />
                    {m.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </div>
  );
}
