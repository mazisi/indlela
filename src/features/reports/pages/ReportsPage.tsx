import { useState } from 'react';
import { CalendarClock, FileCheck2, Mail, Search, SearchX } from 'lucide-react';
import { Paginator } from '@/components/Paginator';
import { useClientPagination } from '@/hooks/useClientPagination';
import { Head } from '@/components/ui/Head';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/page/PageHeader';
import { StatTile } from '@/components/page/StatTile';
import { TileSkeleton } from '@/components/skeletons/TileSkeleton';
import { DataTableSkeleton } from '@/components/table/DataTable';
import { usePermissions } from '@/contexts/PermissionContextType';
import { FormAlert } from '@/features/auth/components/FormAlert';
import { getApiErrorMessage } from '@/utils/formErrorHandler';
import { useReportSites } from '../hooks/useReports';
import { REPORT_PERMISSIONS } from '../lib/permissions';
import type { ReportSite } from '../types';
import { NoSitesState } from '../components/StateCards';
import { ReportSitesTable } from '../components/overview/ReportSitesTable';
import { REPORT_SITE_COLUMNS_SKELETON } from '../lib/skeletons';
import { GenerateReportSheet } from '../components/site/GenerateReportSheet';

const PAGE_TITLE = 'Reports';

const matches = (s: ReportSite, q: string) => [s.name, s.url, s.client?.name ?? ''].some((v) => v.toLowerCase().includes(q));

function summarise(sites: ReportSite[]) {
  const last = sites.map((s) => s.lastReport).filter((r) => r !== null);
  return {
    scheduled: sites.filter((s) => s.schedule?.isActive).length,
    withReports: last.length,
    sent: last.filter((r) => r.sentAt).length,
    failed: last.filter((r) => r.status === 'failed').length,
  };
}

/**
 * Reports overview: every site the user can access with its last report
 * (period, status, sent / shared) and its monthly schedule; Generate opens
 * the drawer for that site.
 */
export default function ReportsPage() {
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(REPORT_PERMISSIONS.create);
  const sites = useReportSites();
  const [search, setSearch] = useState('');
  const [generateFor, setGenerateFor] = useState<ReportSite>();
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
        description="White-label reports for your clients: your logo and colour, a plain-language summary at the top, as a PDF or a share link, and emailed monthly if you like."
      />

      {sites.isPending ? (
        <>
          <TileSkeleton count={3} label="Loading the summary" className="lg:grid-cols-3" />
          <DataTableSkeleton columns={REPORT_SITE_COLUMNS_SKELETON} label="Loading sites" selectable={false} actions={canCreate} />
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
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile label="Monthly schedules" value={`${summary.scheduled} / ${all.length}`} hint={summary.scheduled ? 'Sites emailed a report every month' : 'No site has a monthly report yet'} icon={CalendarClock} />
            <StatTile
              label="Sites with a report"
              value={`${summary.withReports} / ${all.length}`}
              hint={summary.failed ? `${summary.failed} latest ${summary.failed === 1 ? 'report' : 'reports'} failed` : 'Latest report per site'}
              icon={FileCheck2}
              tone={summary.failed ? 'warn' : 'neutral'}
            />
            <StatTile label="Latest report sent" value={`${summary.sent} / ${summary.withReports}`} hint="Emailed to the client" icon={Mail} />
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
              <ReportSitesTable sites={paging.pageRows} canCreate={canCreate} onGenerate={setGenerateFor} />
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

      {canCreate && <GenerateReportSheet site={generateFor} open={Boolean(generateFor)} onOpenChange={(o) => !o && setGenerateFor(undefined)} />}
    </div>
  );
}
