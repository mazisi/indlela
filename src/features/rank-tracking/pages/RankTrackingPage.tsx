import { useState } from 'react';
import { Award, Hash, Search, SearchX, Target, TrendingUp } from 'lucide-react';
import { Paginator } from '@/components/Paginator';
import { useClientPagination } from '@/hooks/useClientPagination';
import { Head } from '@/components/ui/Head';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/page/PageHeader';
import { StatTile } from '@/components/page/StatTile';
import { TileSkeleton } from '@/components/skeletons/TileSkeleton';
import { DataTableSkeleton } from '@/components/table/DataTable';
import { FormAlert } from '@/features/auth/components/FormAlert';
import { formatNumber } from '@/features/search-console/lib/format';
import { getApiErrorMessage } from '@/utils/formErrorHandler';
import { useRankSites, useRankUsage } from '../hooks/useRankTracking';
import type { RankSite } from '../types';
import { NoSitesState } from '../components/StateCards';
import { RankSitesTable } from '../components/overview/RankSitesTable';
import { UsageStrip, UsageStripSkeleton } from '../components/overview/UsageStrip';

const PAGE_TITLE = 'Rank tracking';

const RANK_SITE_COLUMNS_SKELETON = [
  { label: 'Site', skeleton: 'w-40', cell: () => null },
  { label: 'Keywords', skeleton: 'w-8', align: 'right' as const, cell: () => null },
  { label: 'Avg position', skeleton: 'w-10', align: 'right' as const, cell: () => null },
  { label: 'Top 3', skeleton: 'w-6', align: 'right' as const, cell: () => null },
  { label: 'Top 10', skeleton: 'w-6', align: 'right' as const, cell: () => null },
  { label: '7-day change', skeleton: 'w-10', cell: () => null },
  { label: 'Last checked', skeleton: 'w-20', cell: () => null },
];

const matches = (s: RankSite, q: string) => [s.name, s.url, s.client?.name ?? ''].some((v) => v.toLowerCase().includes(q));

/** Figures across the sites the user can see. */
function summarise(sites: RankSite[]) {
  const sum = (pick: (s: RankSite) => number) => sites.reduce((n, s) => n + pick(s), 0);
  const tracked = sites.filter((s) => s.keywordsCount > 0);
  return {
    keywords: sum((s) => s.keywordsCount),
    sitesTracked: tracked.length,
    top3: sum((s) => s.top3),
    top10: sum((s) => s.top10),
    improving: tracked.filter((s) => (s.change7dAvg ?? 0) > 0).length,
    declining: tracked.filter((s) => (s.change7dAvg ?? 0) < 0).length,
  };
}

/**
 * Rank tracking overview: the workspace's usage against its limits, then
 * every site the user can access with its keyword count, positions and
 * weekly movement.
 */
export default function RankTrackingPage() {
  const sites = useRankSites();
  const usage = useRankUsage();
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
        description="Where each site ranks in Google for the searches that matter, by location and device, checked daily or weekly, with the week's biggest gains and drops."
      />

      {usage.isPending ? <UsageStripSkeleton /> : usage.data ? <UsageStrip usage={usage.data} /> : null}

      {sites.isPending ? (
        <>
          <TileSkeleton count={4} label="Loading the summary" />
          <DataTableSkeleton columns={RANK_SITE_COLUMNS_SKELETON} label="Loading sites" selectable={false} actions={false} />
        </>
      ) : sites.isError ? (
        <FormAlert tone="error">
          <p>{getApiErrorMessage(sites.error, 'We could not load the sites.')}</p>
          <p>
            <button type="button" className="font-medium underline" onClick={() => sites.refetch()}>
              Try again
            </button>
          </p>
        </FormAlert>
      ) : all.length === 0 ? (
        <NoSitesState />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Keywords tracked" value={formatNumber(summary.keywords)} hint={`On ${summary.sitesTracked} of ${all.length} ${all.length === 1 ? 'site' : 'sites'}`} icon={Hash} />
            <StatTile label="In the top 3" value={formatNumber(summary.top3)} hint="Keyword × location × device" icon={Award} tone={summary.top3 ? 'ok' : 'neutral'} />
            <StatTile label="In the top 10" value={formatNumber(summary.top10)} hint="On Google's first page" icon={Target} />
            <StatTile
              label="Improving this week"
              value={`${summary.improving} / ${summary.sitesTracked}`}
              hint={summary.declining ? `${summary.declining} ${summary.declining === 1 ? 'site' : 'sites'} slipping` : 'No site slipping'}
              icon={TrendingUp}
              tone={summary.declining > summary.improving ? 'warn' : 'neutral'}
            />
          </div>

          <div className="relative sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input type="search" value={search} onChange={(e) => {
                setSearch(e.target.value);
                paging.reset();
              }} placeholder="Search sites or clients" aria-label="Search sites or clients" className="bg-card pl-9" />
          </div>

          {shown.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded border border-dashed bg-card px-6 py-12 text-center">
              <SearchX className="size-6 text-muted-foreground" aria-hidden />
              <p className="text-sm font-medium">No sites match “{search.trim()}”</p>
              <p className="text-sm text-muted-foreground">Try a shorter or different search.</p>
            </div>
          ) : (
            <div>
              <RankSitesTable sites={paging.pageRows} />
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
