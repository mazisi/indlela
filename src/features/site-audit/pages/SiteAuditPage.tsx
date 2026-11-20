import { useState } from 'react';
import { AlertOctagon, Activity, ScanSearch, Search, SearchX, Timer } from 'lucide-react';
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
import { useAuditSites } from '../hooks/useSiteAudit';
import { BAND_STAT_TONE, healthBand } from '../lib/health';
import type { AuditSite } from '../types';
import { NoSitesState } from '../components/StateCards';
import { SitesTable } from '../components/overview/SitesTable';

const PAGE_TITLE = 'Site audit';

const SKELETON_COLUMNS = [
  { label: 'Site', skeleton: 'w-40', cell: () => null },
  { label: 'Health', skeleton: 'w-16', cell: () => null },
  { label: 'Issues', skeleton: 'w-32', cell: () => null },
  { label: 'Changes', skeleton: 'w-24', cell: () => null },
  { label: 'Last audit', skeleton: 'w-20', cell: () => null },
  { label: 'Schedule', skeleton: 'w-28', cell: () => null },
];

const matches = (s: AuditSite, q: string) => [s.name, s.url, s.client?.name ?? ''].some((v) => v.toLowerCase().includes(q));

/** Figures across the sites the user can see. */
function summarise(sites: AuditSite[]) {
  const done = sites.flatMap((s) => (s.latestAudit?.status === 'done' && s.latestAudit.healthScore !== null ? [s.latestAudit] : []));
  const average = done.length ? Math.round(done.reduce((n, a) => n + (a.healthScore ?? 0), 0) / done.length) : null;
  return {
    audited: done.length,
    average,
    critical: done.reduce((n, a) => n + a.counts.critical, 0),
    sitesWithCritical: done.filter((a) => a.counts.critical > 0).length,
    running: sites.filter((s) => s.runningAudit).length,
  };
}

/**
 * Site audit overview: every site the user can access with its latest health
 * score, issues by severity, what changed since the audit before, schedule
 * and any audit under way (the list polls while one runs).
 */
export default function SiteAuditPage() {
  const sites = useAuditSites();
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
        description="Crawls of each site that find what holds it back in Google, ranked by how much it matters, with a plain-English fix for every issue."
      />

      {sites.isPending ? (
        <>
          <TileSkeleton count={4} label="Loading the summary" />
          <DataTableSkeleton columns={SKELETON_COLUMNS} label="Loading sites" selectable={false} actions={false} />
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
            <StatTile label="Sites audited" value={`${summary.audited} / ${all.length}`} hint="With a finished audit" icon={ScanSearch} />
            <StatTile
              label="Average health"
              value={summary.average}
              hint={summary.average === null ? 'No finished audits yet' : `${healthBand(summary.average).label} · out of 100`}
              icon={Activity}
              tone={summary.average === null ? 'neutral' : BAND_STAT_TONE[healthBand(summary.average).band]}
            />
            <StatTile
              label="Critical issues"
              value={formatNumber(summary.critical)}
              hint={summary.critical ? `On ${summary.sitesWithCritical} ${summary.sitesWithCritical === 1 ? 'site' : 'sites'}: fix these first` : 'None on the latest audits'}
              icon={AlertOctagon}
              tone={summary.critical ? 'bad' : 'ok'}
            />
            <StatTile label="Running now" value={summary.running} hint={summary.running ? 'Updates by itself' : 'No audits under way'} icon={Timer} />
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
              <SitesTable sites={paging.pageRows} />
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
