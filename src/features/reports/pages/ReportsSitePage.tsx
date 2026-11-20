import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';
import { CalendarClock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Head } from '@/components/ui/Head';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { SitePageHeader } from '@/components/page/SitePageHeader';
import { Paginator } from '@/components/Paginator';
import { DataTableSkeleton } from '@/components/table/DataTable';
import { Skeleton } from '@/components/ui/skeleton';
import { usePermissions } from '@/contexts/PermissionContextType';
import { FormAlert } from '@/features/auth/components/FormAlert';
import { useListParams } from '@/hooks/useListParams';
import { useRowSelection } from '@/hooks/useRowSelection';
import showToaster from '@/utils/showToaster';
import { getApiErrorMessage } from '@/utils/formErrorHandler';
import { useReportActions } from '../hooks/useReportActions';
import { useReportSchedule, useReportSites, useSendScheduleNow, useSiteReports } from '../hooks/useReports';
import { lastMonthLabel } from '../lib/period';
import { REPORT_PERMISSIONS } from '../lib/permissions';
import type { ReportPage, ReportRow } from '../types';
import { NoReportsState, SiteNotFoundState } from '../components/StateCards';
import { GenerateReportSheet } from '../components/site/GenerateReportSheet';
import { ReportsBulkBar } from '../components/site/ReportsBulkBar';
import { ReportsTable } from '../components/site/ReportsTable';
import { REPORT_COLUMNS_SKELETON } from '../lib/skeletons';
import { ScheduleSheet } from '../components/site/ScheduleSheet';
import { ScheduleStrip } from '../components/site/ScheduleStrip';
import { SendReportSheet } from '../components/site/SendReportSheet';

/** After a report lands, the list is re-read at these delays: a requested email goes out just after "ready". */
const AFTER_READY_REFRESH_MS = [4_000, 10_000];

/**
 * Says when a report generating on this page lands (ready or failed): the
 * list polls while one is generating (useSiteReports), this compares. A
 * ready report may still be on its way by email ("Email it when ready" is
 * sent right after it's marked ready), so the list is re-read twice more
 * to show "Sent" without a reload.
 */
function useAnnounceFinished(page: ReportPage | undefined, refetch: () => void) {
  const generating = useRef(new Set<number>());
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);
  useEffect(() => {
    if (!page) return;
    page.data.forEach((r) => {
      if (r.status === 'generating') generating.current.add(r.id);
      else if (generating.current.delete(r.id)) {
        if (r.status === 'ready') {
          showToaster('success', `“${r.title}” is ready.`);
          if (!r.sentAt) AFTER_READY_REFRESH_MS.forEach((ms) => timers.current.push(window.setTimeout(refetch, ms)));
        } else showToaster('error', `“${r.title}” could not be generated${r.error ? `: ${r.error}` : '.'}`);
      }
    });
  }, [page, refetch]);
}

/**
 * One site's reports: its monthly schedule, Generate, and every report with
 * its status (polled while generating), summary, delivery and share link;
 * row actions follow the user's permissions.
 */
export default function ReportsSitePage() {
  const siteId = Number(useParams().siteId);
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(REPORT_PERMISSIONS.create);
  const canDelete = hasPermission(REPORT_PERMISSIONS.delete);
  const { page, perPage, onPageChange, onPerPageChange } = useListParams();

  const sites = useReportSites();
  const site = sites.data?.find((s) => s.id === siteId);
  const reports = useSiteReports(siteId, { page, perPage }, Boolean(site));
  const schedule = useReportSchedule(siteId, Boolean(site));
  const actions = useReportActions(siteId);
  useAnnounceFinished(reports.data, reports.refetch);

  const [generating, setGenerating] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [sending, setSending] = useState<ReportRow>();
  const [revoking, setRevoking] = useState<ReportRow>();
  const [deleting, setDeleting] = useState<ReportRow>();
  const [sendingNow, setSendingNow] = useState(false);
  const sendNow = useSendScheduleNow(siteId);

  const rows = reports.data?.data ?? [];
  const hasReports = (reports.data?.meta.total ?? 0) > 0;
  const currentSchedule = schedule.data ?? site?.schedule ?? null;
  const bulkable = canCreate || canDelete;
  const selection = useRowSelection(
    // Generating reports can't be selected ("select all" leaves them out too).
    rows.filter((r) => r.status !== 'generating').map((r) => r.id),
    `${siteId}:${page}:${perPage}`,
  );

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <Head title={site ? `${site.name} · Reports` : 'Reports'} />
      <SitePageHeader
        module="reports"
        site={site}
        loading={sites.isPending}
        actions={
          site &&
          canCreate && (
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={() => setScheduling(true)}>
                <CalendarClock />
                Schedule
              </Button>
              <Button onClick={() => setGenerating(true)}>
                <Plus />
                Generate report
              </Button>
            </div>
          )
        }
      />

      {sites.isPending ? (
        <SitePageSkeleton bulkable={bulkable} />
      ) : sites.isError ? (
        <LoadError error={sites.error} what="this site" onRetry={() => sites.refetch()} />
      ) : !site ? (
        <SiteNotFoundState />
      ) : reports.isPending ? (
        <SitePageSkeleton bulkable={bulkable} />
      ) : reports.isError ? (
        <LoadError error={reports.error} what="the reports" onRetry={() => reports.refetch()} />
      ) : !hasReports ? (
        <NoReportsState canCreate={canCreate} onGenerate={() => setGenerating(true)} onSchedule={() => setScheduling(true)} />
      ) : (
        <>
          <ScheduleStrip schedule={currentSchedule} canEdit={canCreate} onEdit={() => setScheduling(true)} onSendNow={() => setSendingNow(true)} />
          <div className="space-y-2">
            {bulkable && selection.count > 0 && <ReportsBulkBar siteId={siteId} rows={rows} selection={selection} canCreate={canCreate} canDelete={canDelete} />}
            <ReportsTable
              siteId={siteId}
              rows={rows}
              canCreate={canCreate}
              canDelete={canDelete}
              actions={actions}
              onSend={setSending}
              onRevoke={setRevoking}
              onDelete={setDeleting}
              selection={bulkable ? selection : undefined}
            />
          </div>
          {reports.data && (
            <Paginator
              currentPage={reports.data.meta.currentPage}
              lastPage={reports.data.meta.lastPage}
              totalItems={reports.data.meta.total}
              perPage={reports.data.meta.perPage}
              onPageChange={onPageChange}
              onPerPageChange={onPerPageChange}
            />
          )}
        </>
      )}

      {site && canCreate && (
        <>
          <GenerateReportSheet site={site} open={generating} onOpenChange={setGenerating} />
          <ScheduleSheet site={site} open={scheduling} onOpenChange={setScheduling} />
          <SendReportSheet siteId={siteId} report={sending} suggested={currentSchedule?.recipients} onClose={() => setSending(undefined)} />
        </>
      )}

      <ConfirmationDialog
        open={sendingNow}
        onOpenChange={setSendingNow}
        title="Send last month's report now?"
        description={`We'll generate the ${lastMonthLabel()} report with the schedule's sections and note, and email it to ${currentSchedule?.recipients.join(', ') ?? 'the schedule\'s recipients'} as soon as it's ready. The monthly report still goes out on its usual day.`}
        confirmLabel="Send now"
        isLoading={sendNow.isPending}
        onConfirm={async () => {
          try {
            const row = await sendNow.mutateAsync();
            showToaster('success', `Generating “${row.title}”. It will be emailed as soon as it's ready.`);
            setSendingNow(false);
          } catch (error) {
            showToaster('error', getApiErrorMessage(error, 'The report could not be sent.'));
          }
        }}
      />
      <ConfirmationDialog
        open={Boolean(revoking)}
        onOpenChange={(o) => !o && setRevoking(undefined)}
        title="Revoke the share link?"
        description={`Anyone who opens the link to “${revoking?.title ?? ''}” will see that it is no longer available. You can create a new link afterwards.`}
        confirmLabel="Revoke link"
        variant="danger"
        isLoading={actions.revoking}
        onConfirm={async () => {
          if (revoking && (await actions.revokeLink(revoking))) setRevoking(undefined);
        }}
      />
      <ConfirmationDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(undefined)}
        title="Delete this report?"
        description={`“${deleting?.title ?? ''}” and its PDF are deleted, and its share link stops working. This can't be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={actions.deleting}
        onConfirm={async () => {
          if (deleting && (await actions.deleteReport(deleting))) setDeleting(undefined);
        }}
      />
    </div>
  );
}

function SitePageSkeleton({ bulkable }: { bulkable: boolean }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading the reports">
      <div className="flex items-center gap-3 rounded border bg-card px-4 py-3">
        <Skeleton className="size-8 rounded" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-56 rounded" />
          <Skeleton className="h-3 w-80 max-w-full rounded" />
        </div>
      </div>
      <DataTableSkeleton columns={REPORT_COLUMNS_SKELETON} rows={5} label="Loading the reports" selectable={bulkable} />
    </div>
  );
}

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
