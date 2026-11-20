import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { Head } from '@/components/ui/Head';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page/PageHeader';
import { usePermissions } from '@/contexts/PermissionContextType';
import { FormAlert } from '@/features/auth/components/FormAlert';
import { formatDate, formatDateTime } from '@/utils/formatDate';
import { getApiErrorMessage } from '@/utils/formErrorHandler';
import { useAuditParams } from '../hooks/useAuditParams';
import { useAuditRun, useRunAudit } from '../hooks/useAuditRun';
import { useAudit, useAuditSites, useAudits } from '../hooks/useSiteAudit';
import { isRunning, progressLabel } from '../lib/auditStatus';
import { decideDetailState } from '../lib/pageState';
import type { Audit } from '../types';
import { AuditDashboard } from '../components/AuditDashboard';
import { AuditSettingsSheet } from '../components/AuditSettingsSheet';
import { AuditSummarySkeleton } from '../components/AuditSummary';
import { RunControls } from '../components/RunControls';
import { AuditFailedState, FirstAuditRunningState, NeverAuditedState, SiteNotFoundState } from '../components/StateCards';

const UPDATE_PERMISSION = 'update_site_audit';
/** The history page the trend chart and the default audit are taken from. */
const RECENT = { page: 1, perPage: 30 };

/**
 * One site's audit: health, issues by severity and what changed since the
 * previous crawl, with Issues / Pages / Core Web Vitals / History tabs.
 * The audit (`?audit=`, default the latest done) and the tab live in the URL;
 * what shows is decided by `decideDetailState`. A running audit is polled
 * every 3 s and the page refreshes itself when it stops.
 */
export default function SiteAuditDetailPage() {
  const siteId = Number(useParams().siteId);
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(UPDATE_PERMISSION);
  const params = useAuditParams();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const sites = useAuditSites();
  const site = sites.data?.find((s) => s.id === siteId);
  const running = useAuditRun(site);
  const recent = useAudits(siteId, RECENT, Boolean(site));
  const { run, starting } = useRunAudit();

  const state = sites.data ? decideDetailState(site, running, params.auditId, recent.data?.data) : null;
  const shownId = state?.kind === 'ready' ? state.auditId : undefined;
  const shown = useAudit(shownId);
  const latestDoneId = site?.latestAudit?.status === 'done' ? site.latestAudit.id : recent.data?.data.find((a) => a.status === 'done')?.id;
  const runProps = { canRun: canManage, starting: site ? starting(site.id) : false, onRun: () => site && run(site) };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <Head title={site ? `${site.name} · Site audit` : 'Site audit'} />
      <Link to="/dashboard/site-audit" className="-mb-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary">
        <ArrowLeft className="size-3.5" aria-hidden />
        All sites
      </Link>
      <PageHeader
        eyebrow={site?.client ? `Site audit · ${site.client.name}` : 'Site audit'}
        title={site?.name ?? (sites.isPending ? 'Loading…' : 'Site audit')}
        description={site && <a href={site.url} target="_blank" rel="noreferrer noopener" className="hover:text-primary hover:underline">{site.url}</a>}
        actions={
          site &&
          state &&
          state.kind !== 'not_found' &&
          state.kind !== 'loading' && (
            <RunControls
              running={running}
              canManage={canManage}
              starting={runProps.starting}
              onRun={runProps.onRun}
              onSettings={() => setSettingsOpen(true)}
              // The state cards carry their own Run button and progress.
              showRun={state.kind === 'ready'}
              showProgress={state.kind !== 'first_running'}
            />
          )
        }
      />

      {sites.isPending ? (
        <PageSkeleton />
      ) : sites.isError ? (
        <FormAlert tone="error">
          <p>{getApiErrorMessage(sites.error, 'We could not load this site.')}</p>
          <p>
            <button type="button" className="font-medium underline" onClick={() => sites.refetch()}>
              Try again
            </button>
          </p>
        </FormAlert>
      ) : (
        <>
          {state?.kind === 'not_found' && <SiteNotFoundState />}
          {state?.kind === 'loading' && <PageSkeleton />}
          {state?.kind === 'never_audited' && <NeverAuditedState {...runProps} />}
          {state?.kind === 'first_running' && <FirstAuditRunningState audit={state.audit} />}
          {state?.kind === 'failed' && <AuditFailedState audit={state.audit} {...runProps} />}
          {state?.kind === 'ready' && (
            <>
              {state.failedLatest && !running && <FailedLatestNotice audit={state.failedLatest} canRun={canManage} onRun={runProps.onRun} starting={runProps.starting} />}
              {params.auditId && params.auditId !== latestDoneId && shown.data && (
                <FormAlert tone="info">
                  <p>
                    You're looking at the audit of {formatDate(shown.data.finishedAt ?? shown.data.startedAt ?? '')}, not the latest one.{' '}
                    <button type="button" className="font-medium underline" onClick={() => params.setAudit(undefined)}>
                      Show the latest audit
                    </button>
                  </p>
                </FormAlert>
              )}
              <ShownAudit query={shown} recent={recent.data?.data} params={params} />
            </>
          )}
        </>
      )}

      {site && canManage && <AuditSettingsSheet site={site} open={settingsOpen} onOpenChange={setSettingsOpen} />}
    </div>
  );
}

function FailedLatestNotice({ audit, canRun, starting, onRun }: { audit: Audit; canRun: boolean; starting: boolean; onRun: () => void }) {
  const when = audit.finishedAt ? ` on ${formatDateTime(audit.finishedAt)}` : '';
  return (
    <FormAlert tone="warning">
      <p>
        {audit.status === 'cancelled' ? `The latest audit was cancelled${when}.` : `The latest audit failed${when}${audit.error ? `: ${audit.error}` : '.'}`} Showing the last
        finished audit instead.
      </p>
      {canRun && (
        <p>
          <button type="button" className="font-medium underline disabled:opacity-60" onClick={onRun} disabled={starting}>
            {audit.status === 'cancelled' ? 'Run audit' : 'Try again'}
          </button>
        </p>
      )}
    </FormAlert>
  );
}

function ShownAudit({ query, recent, params }: { query: ReturnType<typeof useAudit>; recent: Audit[] | undefined; params: ReturnType<typeof useAuditParams> }) {
  if (query.isError) {
    return (
      <FormAlert tone="error">
        <p>{getApiErrorMessage(query.error, 'We could not load this audit.')}</p>
        <p>
          <button type="button" className="font-medium underline" onClick={() => (params.auditId ? params.setAudit(undefined) : query.refetch())}>
            {params.auditId ? 'Show the latest audit' : 'Try again'}
          </button>
        </p>
      </FormAlert>
    );
  }
  if (!query.data) return <AuditSummarySkeleton />;
  const audit = query.data;
  if (audit.status !== 'done') {
    return (
      <FormAlert tone={isRunning(audit) ? 'info' : 'warning'}>
        <p>{isRunning(audit) ? `This audit is still running: ${progressLabel(audit)}` : `This audit has no results: it ${audit.status === 'failed' ? `failed${audit.error ? ` (${audit.error})` : ''}` : 'was cancelled'}.`}</p>
        <p>
          <button type="button" className="font-medium underline" onClick={() => params.setAudit(undefined)}>
            Show the latest audit
          </button>
        </p>
      </FormAlert>
    );
  }
  return <AuditDashboard audit={audit} recent={recent} tab={params.tab} onTabChange={params.setTab} onSelectAudit={(a) => params.setAudit(a.id)} />;
}

function PageSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading the site audit">
      <AuditSummarySkeleton />
      <div className="flex gap-4 border-b pb-2.5">
        {['w-14', 'w-12', 'w-28', 'w-14'].map((w) => (
          <Skeleton key={w} className={`h-4 rounded ${w}`} />
        ))}
      </div>
    </div>
  );
}
