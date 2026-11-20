import { useState } from 'react';
import { Navigate } from 'react-router';
import { Building2, CalendarDays, Lock, Search, SearchX } from 'lucide-react';
import { Head } from '@/components/ui/Head';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/page/PageHeader';
import { Paginator } from '@/components/Paginator';
import { DataTableSkeleton } from '@/components/table/DataTable';
import { useListParams } from '@/hooks/useListParams';
import { useUrlSort } from '@/hooks/useUrlSort';
import { FormAlert } from '@/features/auth/components/FormAlert';
import { getApiErrorMessage } from '@/utils/formErrorHandler';
import { CostByMonthChart, CostByMonthChartSkeleton } from '../components/CostByMonthChart';
import { EditLimitSheet } from '../components/EditLimitSheet';
import { UsageKpis, UsageKpisSkeleton } from '../components/UsageKpis';
import { WorkspacesTable } from '../components/WorkspacesTable';
import { workspaceColumns } from '../components/workspaceColumns';
import { usePlatformUsage, useWorkspaceUsage } from '../hooks/usePlatformUsage';
import { statusOf } from '../lib/errors';
import { monthLabel } from '../lib/format';
import { WORKSPACE_SORT_KEYS, type WorkspaceUsage, type WorkspaceUsageQuery } from '../types';

const PAGE_TITLE = 'Platform usage';

/** Busiest spenders first until a column is chosen. */
const DEFAULT_SORT: WorkspaceUsageQuery['sort'] = { key: 'cost_this_month', direction: 'desc' };

/** The platform default when the summary hasn't loaded (the API's RANK_WORKSPACE_KEYWORD_LIMIT). */
const FALLBACK_KEYWORD_LIMIT = 500;

function LoadError({ error, what, onRetry }: { error: unknown; what: string; onRetry: () => void }) {
  return (
    <FormAlert tone="error">
      <p>{getApiErrorMessage(error, `We could not load ${what}.`)}</p>
      <p>
        <button type="button" className="font-medium underline" onClick={onRetry}>
          Try again
        </button>
      </p>
    </FormAlert>
  );
}

/**
 * Platform › Usage (Indlela staff only, `view_platform_usage`): this month's
 * DataForSEO spend against the cap, the provider's balance, six months of
 * cost, and every workspace's keywords, checks and cost, with its keyword
 * limit editable in a drawer. Search, sort and page live in the URL.
 */
export default function PlatformUsagePage() {
  const usage = usePlatformUsage();
  const list = useListParams();
  const { sort: urlSort, onSort } = useUrlSort(WORKSPACE_SORT_KEYS);
  const sort = urlSort ?? DEFAULT_SORT;
  const workspaces = useWorkspaceUsage({ page: list.page, perPage: list.perPage, search: list.search, sort });
  const rows = workspaces.data?.data ?? [];
  const meta = workspaces.data?.meta;
  const [editing, setEditing] = useState<WorkspaceUsage | undefined>();

  // The API refuses anyone without the permission (it lives only in the platform workspace).
  if (statusOf(usage.error) === 403 || statusOf(workspaces.error) === 403) return <Navigate to="/dashboard/unauthorized" replace />;

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <Head title={PAGE_TITLE} />
      <PageHeader
        eyebrow="Platform"
        title={PAGE_TITLE}
        description={
          <span className="inline-flex items-center gap-1.5">
            <Lock className="size-3.5" aria-hidden />
            Internal · Indlela staff only
          </span>
        }
        actions={
          usage.data && (
            <span className="inline-flex items-center gap-1.5 rounded border bg-card px-2.5 py-1 text-sm font-medium shadow-xs" data-testid="usage-month">
              <CalendarDays className="size-4 text-muted-foreground" aria-hidden />
              {monthLabel(usage.data.month)}
            </span>
          )
        }
      />

      {usage.isPending ? (
        <>
          <UsageKpisSkeleton />
          <CostByMonthChartSkeleton />
        </>
      ) : usage.isError ? (
        <LoadError error={usage.error} what="the platform's usage" onRetry={() => usage.refetch()} />
      ) : (
        <>
          <UsageKpis usage={usage.data} />
          <CostByMonthChart series={usage.data.series} current={usage.data.month} />
        </>
      )}

      <section aria-labelledby="platform-workspaces-title" className="space-y-3 pt-2">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 id="platform-workspaces-title" className="text-base font-semibold">
              Workspaces
            </h2>
            <p className="text-xs text-muted-foreground">Rank-tracking usage and DataForSEO cost per customer workspace this month.</p>
          </div>
          <div className="relative md:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              type="search"
              value={list.searchInput}
              onChange={(e) => list.setSearchInput(e.target.value)}
              placeholder="Search workspace, slug or owner"
              aria-label="Search workspaces"
              className="bg-card pl-9"
            />
          </div>
        </div>

        {workspaces.isError ? (
          <LoadError error={workspaces.error} what="the workspaces" onRetry={() => workspaces.refetch()} />
        ) : workspaces.isPending ? (
          <DataTableSkeleton columns={workspaceColumns} label="Loading the workspaces" selectable={false} />
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded border border-dashed bg-card px-6 py-14 text-center">
            {list.search ? <SearchX className="size-6 text-muted-foreground" aria-hidden /> : <Building2 className="size-6 text-muted-foreground" aria-hidden />}
            <p className="text-sm font-medium">{list.search ? `No workspaces match “${list.search}”` : 'No workspaces yet'}</p>
            <p className="text-sm text-muted-foreground">{list.search ? 'Try a name, slug or owner email.' : 'Customer workspaces appear here once someone signs up.'}</p>
          </div>
        ) : (
          <div className={workspaces.isFetching ? 'space-y-2 opacity-60 transition-opacity' : 'space-y-2 transition-opacity'}>
            <WorkspacesTable rows={rows} sort={sort} onSort={onSort} onEditLimit={setEditing} />
            {meta && (
              <Paginator
                currentPage={meta.currentPage}
                lastPage={meta.lastPage}
                totalItems={meta.total}
                perPage={meta.perPage}
                onPageChange={list.onPageChange}
                onPerPageChange={list.onPerPageChange}
              />
            )}
          </div>
        )}
      </section>

      <EditLimitSheet workspace={editing} defaultLimit={usage.data?.limits.workspaceKeywordLimit ?? FALLBACK_KEYWORD_LIMIT} onClose={() => setEditing(undefined)} />
    </div>
  );
}
