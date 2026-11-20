import { Loader2, RefreshCw } from 'lucide-react';
import { Head } from '@/components/ui/Head';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page/PageHeader';
import { usePermissions } from '@/contexts/PermissionContextType';
import { FormAlert } from '@/features/auth/components/FormAlert';
import showToaster from '@/utils/showToaster';
import { getApiErrorMessage } from '@/utils/formErrorHandler';
import { useConnectGoogle, useGoogleConnection, useGscSites, useSyncSite } from '../hooks/useSearchConsole';
import { useOAuthReturn } from '../hooks/useOAuthReturn';
import { useScParams } from '../hooks/useScParams';
import { rangeFor } from '../lib/dateRange';
import { decidePageState } from '../lib/pageState';
import { isSyncing } from '../lib/syncStatus';
import type { GscSite, ReportScope } from '../types';
import { Dashboard } from '../components/Dashboard';
import { GoogleAccountMenu } from '../components/GoogleAccountMenu';
import { CompareSelect, RangeSelect, SitePicker, SyncStatusBadge } from '../components/HeaderControls';
import { KpiTilesSkeleton } from '../components/KpiTiles';
import { PerformanceChartSkeleton } from '../components/PerformanceChart';
import { ConnectState, ImportFailedState, ImportingState, NoSitesState, NotLinkedState } from '../components/StateCards';

const PAGE_TITLE = 'Search Console';
const UPDATE_PERMISSION = 'update_search_console';

/**
 * Search Console: connect Google once per workspace, link each site to its
 * property, then clicks / impressions / CTR / position with the Queries,
 * Pages, Quick wins, Low CTR and Content decay reports. Site, range, compare,
 * tab and the table's page/search/sort live in the URL. What shows is decided
 * by `decidePageState` (connection → sites → link → import → dashboard).
 */
export default function SearchConsolePage() {
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(UPDATE_PERMISSION);
  useOAuthReturn();
  const sc = useScParams();

  const connection = useGoogleConnection();
  const connected = Boolean(connection.data);
  const sites = useGscSites(connected);
  const connect = useConnectGoogle();
  const sync = useSyncSite();

  const startConnect = () =>
    connect.mutate(undefined, { onError: (error) => showToaster('error', getApiErrorMessage(error, 'Could not reach Google. Please try again.')) });

  const startSync = (site: GscSite) =>
    sync.mutate(site.id, {
      onSuccess: () => showToaster('success', `Sync started for ${site.name}.`),
      onError: (error) => showToaster('error', getApiErrorMessage(error, 'Could not start the sync.')),
    });

  const loading = connection.isPending || (connected && sites.isPending);
  const failed = connection.isError || (connected && sites.isError);
  const state = !loading && !failed ? decidePageState(connection.data ?? null, sites.data ?? [], sc.siteId) : null;
  const site = state && 'site' in state ? state.site : undefined;
  const ready = state?.kind === 'ready' ? state.site : undefined;
  const busy = site ? isSyncing(site) || (sync.isPending && sync.variables === site.id) : false;

  const range = ready ? rangeFor(sc.range, ready.gscDataThrough) : undefined;
  const scope: ReportScope | undefined = ready && range ? { siteId: ready.id, ...range, compare: sc.compare, syncedAt: ready.gscSyncedAt } : undefined;

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <Head title={PAGE_TITLE} />
      <PageHeader
        title={PAGE_TITLE}
        description="Clicks, impressions, click-through rate and rankings from Google Search, with the reports that show where the next traffic is."
        actions={
          connection.data && (
            <div className="flex flex-wrap items-center gap-2">
              {site?.gscProperty && <SyncStatusBadge site={site} />}
              {canManage && site?.gscProperty && (
                <Button variant="outline" className="h-9 bg-card" onClick={() => startSync(site)} disabled={busy}>
                  {busy ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                  Sync now
                </Button>
              )}
              <GoogleAccountMenu connection={connection.data} site={site} canManage={canManage} onReconnect={startConnect} />
            </div>
          )
        }
      />

      {loading ? (
        <PageSkeleton />
      ) : failed ? (
        <FormAlert tone="error">
          <p>{getApiErrorMessage(connection.error ?? sites.error, 'We could not load Search Console.')}</p>
          <p>
            <button type="button" className="font-medium underline" onClick={() => (connection.isError ? connection.refetch() : sites.refetch())}>
              Try again
            </button>
          </p>
        </FormAlert>
      ) : (
        <>
          {connection.data && connection.data.status !== 'active' && (
            <FormAlert tone="warning">
              <p>
                Google access {connection.data.status === 'revoked' ? 'was revoked' : 'stopped working'}
                {connection.data.lastError ? `: ${connection.data.lastError}` : '.'} Syncing is paused until Google is reconnected.
              </p>
              {canManage && (
                <p>
                  <button type="button" className="font-medium underline" onClick={startConnect}>
                    Reconnect Google
                  </button>
                </p>
              )}
            </FormAlert>
          )}

          {connected && (sites.data?.length ?? 0) > 0 && (
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <SitePicker sites={sites.data ?? []} value={site?.id} onChange={sc.setSite} />
              {ready && (
                <>
                  <RangeSelect value={sc.range} onChange={sc.setRange} />
                  <CompareSelect value={sc.compare} onChange={sc.setCompare} />
                </>
              )}
            </div>
          )}

          {state?.kind === 'not_connected' && <ConnectState canConnect={canManage} connecting={connect.isPending || connect.isSuccess} onConnect={startConnect} />}
          {state?.kind === 'no_sites' && <NoSitesState />}
          {state?.kind === 'not_linked' && <NotLinkedState key={state.site.id} site={state.site} canLink={canManage} />}
          {state?.kind === 'importing' && <ImportingState site={state.site} />}
          {state?.kind === 'import_failed' && <ImportFailedState site={state.site} canSync={canManage} syncing={busy} onSync={() => startSync(state.site)} />}
          {scope && <Dashboard scope={scope} tab={sc.tab} onTabChange={sc.setTab} />}
        </>
      )}
    </div>
  );
}

/** The dashboard's shape while the connection and sites load: the toolbar, tiles and chart. */
function PageSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading Search Console">
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-9 w-72 rounded" />
        <Skeleton className="h-9 w-40 rounded" />
        <Skeleton className="h-9 w-48 rounded" />
      </div>
      <KpiTilesSkeleton />
      <PerformanceChartSkeleton />
    </div>
  );
}
