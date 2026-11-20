import { useState } from 'react';
import { Award, Crosshair, Grid3x3, PieChart, Search, SearchX } from 'lucide-react';
import { Paginator } from '@/components/Paginator';
import { useClientPagination } from '@/hooks/useClientPagination';
import { Head } from '@/components/ui/Head';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/page/PageHeader';
import { StatTile } from '@/components/page/StatTile';
import { TileSkeleton } from '@/components/skeletons/TileSkeleton';
import { DataTableSkeleton } from '@/components/table/DataTable';
import { formatNumber } from '@/features/search-console/lib/format';
import { useLocalGridSites, useLocalGridUsage } from '../hooks/useLocalGrid';
import { formatAvgRank, formatShare } from '../lib/labels';
import type { LocalGridSite } from '../types';
import { LoadError } from '../components/LoadError';
import { NoSitesState } from '../components/StateCards';
import { LocalGridSitesTable } from '../components/overview/LocalGridSitesTable';
import { SITE_COLUMNS_SKELETON } from '../lib/skeletons';
import { UsageStrip, UsageStripSkeleton } from '../components/overview/UsageStrip';

const PAGE_TITLE = 'Local grid';

const matches = (s: LocalGridSite, q: string) => [s.name, s.url, s.domain, s.client?.name ?? '', s.latestScan?.keyword ?? ''].some((v) => v.toLowerCase().includes(q));

const average = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null);

/** Figures across the sites the user can see (their latest finished scans). */
function summarise(sites: LocalGridSite[]) {
  const scanned = sites.map((s) => s.latestScan).filter((s) => s?.status === 'done');
  return {
    grids: sites.reduce((n, s) => n + s.gridsCount, 0),
    sitesWithGrids: sites.filter((s) => s.gridsCount > 0).length,
    scanned: scanned.length,
    arp: average(scanned.flatMap((s) => (s?.arp != null ? [s.arp] : []))),
    solv: average(scanned.flatMap((s) => (s?.solv != null ? [s.solv] : []))),
  };
}

/**
 * Local grid overview: the workspace's allowance, then every site the user
 * can access with its grids and the latest scan's average rank and share of
 * the map pack's top 3.
 */
export default function LocalGridPage() {
  const sites = useLocalGridSites();
  const usage = useLocalGridUsage();
  const [search, setSearch] = useState('');
  const q = search.trim().toLowerCase();
  const all = [...(sites.data ?? [])].sort((a, b) => (a.client?.name ?? '').localeCompare(b.client?.name ?? '') || a.name.localeCompare(b.name));
  const shown = q ? all.filter((s) => matches(s, q)) : all;
  const paging = useClientPagination(shown);
  const summary = summarise(all);

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <Head title={PAGE_TITLE} />
      <PageHeader
        title={PAGE_TITLE}
        description="Where each business shows in the Google map pack from a grid of points across its area, as a heatmap: strong where it's green, missing where it's grey."
      />

      {usage.isPending ? <UsageStripSkeleton /> : usage.data ? <UsageStrip usage={usage.data} /> : null}

      {sites.isPending ? (
        <>
          <TileSkeleton count={4} label="Loading the summary" />
          <DataTableSkeleton columns={SITE_COLUMNS_SKELETON} label="Loading sites" selectable={false} actions={false} />
        </>
      ) : sites.isError ? (
        <LoadError error={sites.error} what="the sites" onRetry={() => sites.refetch()} />
      ) : all.length === 0 ? (
        <NoSitesState />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Grids" value={formatNumber(summary.grids)} hint={`On ${summary.sitesWithGrids} of ${all.length} ${all.length === 1 ? 'site' : 'sites'}`} icon={Grid3x3} />
            <StatTile label="Sites scanned" value={formatNumber(summary.scanned)} hint="With a finished latest scan" icon={Crosshair} />
            <StatTile label="Average rank" value={formatAvgRank(summary.arp)} hint="Where found, latest scans" icon={Award} tone={summary.arp !== null && summary.arp <= 3 ? 'ok' : 'neutral'} />
            <StatTile label="Top 3 share" value={formatShare(summary.solv)} hint="Points in the map pack's top 3" icon={PieChart} />
          </div>

          <div className="relative sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                paging.reset();
              }}
              placeholder="Search sites, clients or keywords"
              aria-label="Search sites, clients or keywords"
              className="bg-card pl-9"
            />
          </div>

          {shown.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded border border-dashed bg-card px-6 py-12 text-center">
              <SearchX className="size-6 text-muted-foreground" aria-hidden />
              <p className="text-sm font-medium">No sites match “{search.trim()}”</p>
              <p className="text-sm text-muted-foreground">Try a shorter or different search.</p>
            </div>
          ) : (
            <div>
              <LocalGridSitesTable sites={paging.pageRows} />
              <Paginator
                currentPage={paging.meta.currentPage}
                lastPage={paging.meta.lastPage}
                totalItems={paging.meta.total}
                perPage={paging.meta.perPage}
                onPageChange={paging.onPageChange}
                onPerPageChange={paging.onPerPageChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
