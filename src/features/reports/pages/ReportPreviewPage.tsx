import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { AlertCircle, ArrowLeft, FileDown, Link2Off, Loader2, Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Head } from '@/components/ui/Head';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { StateCard } from '@/components/page/StateCard';
import { StickyBar } from '@/components/page/StickyBar';
import { usePermissions } from '@/contexts/PermissionContextType';
import { FormAlert } from '@/features/auth/components/FormAlert';
import { getApiErrorMessage } from '@/utils/formErrorHandler';
import { useReportActions } from '../hooks/useReportActions';
import { useReport, useReportSchedule } from '../hooks/useReports';
import { REPORT_PERMISSIONS } from '../lib/permissions';
import type { ReportDetail } from '../types';
import { ReportStatusBadge, ShareState } from '../components/cells';
import { ReportNotFoundState } from '../components/StateCards';
import { SendReportSheet } from '../components/site/SendReportSheet';
import { ShareLinkButton } from '../components/site/ShareLinkButton';
import { ReportView, ReportViewSkeleton } from '../components/view/ReportView';

const isNotFound = (error: unknown) => [403, 404].includes((error as { response?: { status?: number } }).response?.status ?? 0);

/**
 * A report as the client will see it (the same ReportView as the share
 * page), under an action bar: Download PDF, Share (copy / create a link,
 * revoke), Send and Delete, each with its permission. A generating report
 * polls until it's ready.
 */
export default function ReportPreviewPage() {
  const params = useParams();
  const siteId = Number(params.siteId);
  const reportId = Number(params.reportId);
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(REPORT_PERMISSIONS.create);
  const canDelete = hasPermission(REPORT_PERMISSIONS.delete);
  const query = useReport(reportId);
  const report = query.data;
  const schedule = useReportSchedule(siteId, canCreate);
  const actions = useReportActions(siteId);
  const [sending, setSending] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const back = `/dashboard/reports/${siteId}`;

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <Head title={report ? `${report.title} · Reports` : 'Report'} />
      <Link to={back} className="-mb-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary print:hidden">
        <ArrowLeft className="size-3.5" aria-hidden />
        {report?.data?.site?.name ? `${report.data.site.name}'s reports` : "The site's reports"}
      </Link>

      {query.isPending ? (
        <div className="overflow-hidden rounded border">
          <ReportViewSkeleton />
        </div>
      ) : query.isError || !report ? (
        isNotFound(query.error) ? (
          <ReportNotFoundState siteId={siteId} />
        ) : (
          <FormAlert tone="error">
            <p>{getApiErrorMessage(query.error, 'We could not load the report.')}</p>
            <p>
              <button type="button" className="font-medium underline" onClick={() => query.refetch()}>
                Try again
              </button>
            </p>
          </FormAlert>
        )
      ) : (
        <>
          <ActionBar
            report={report}
            canCreate={canCreate}
            canDelete={canDelete}
            actions={actions}
            onSend={() => setSending(true)}
            onRevoke={() => setRevoking(true)}
            onDelete={() => setDeleting(true)}
          />
          {report.status === 'generating' ? (
            <StateCard icon={Loader2} title="Generating the report…">
              <p className="mt-1 max-w-md text-sm text-muted-foreground">Gathering the figures and writing the summary. This page updates by itself when it's ready.</p>
            </StateCard>
          ) : report.status === 'failed' || !report.data ? (
            <StateCard icon={AlertCircle} tone="bad" title="This report could not be generated">
              <p className="mt-1 max-w-md text-sm text-muted-foreground">{report.error ?? 'Something went wrong while building it.'} Generate a new one from the site's reports.</p>
              <Button asChild variant="outline" className="mt-5">
                <Link to={back}>Back to the site's reports</Link>
              </Button>
            </StateCard>
          ) : (
            <div className="overflow-hidden rounded border shadow-xs">
              <ReportView
                report={{ title: report.title, periodLabel: report.periodLabel, summary: report.summary, note: report.note, data: report.data, branding: report.branding, generatedAt: report.createdAt }}
              />
            </div>
          )}
        </>
      )}

      {report && canCreate && <SendReportSheet siteId={siteId} report={sending ? report : undefined} suggested={schedule.data?.recipients} onClose={() => setSending(false)} />}
      <ConfirmationDialog
        open={revoking}
        onOpenChange={setRevoking}
        title="Revoke the share link?"
        description="Anyone who opens the link will see that it is no longer available. You can create a new link afterwards."
        confirmLabel="Revoke link"
        variant="danger"
        isLoading={actions.revoking}
        onConfirm={async () => {
          if (report && (await actions.revokeLink(report))) setRevoking(false);
        }}
      />
      <ConfirmationDialog
        open={deleting}
        onOpenChange={setDeleting}
        title="Delete this report?"
        description={`“${report?.title ?? ''}” and its PDF are deleted, and its share link stops working. This can't be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={actions.deleting}
        onConfirm={async () => {
          if (report && (await actions.deleteReport(report))) navigate(back, { replace: true });
        }}
      />
    </div>
  );
}

interface ActionBarProps {
  report: ReportDetail;
  canCreate: boolean;
  canDelete: boolean;
  actions: ReturnType<typeof useReportActions>;
  onSend: () => void;
  onRevoke: () => void;
  onDelete: () => void;
}

function ActionBar({ report, canCreate, canDelete, actions, onSend, onRevoke, onDelete }: ActionBarProps) {
  const ready = report.status === 'ready';
  return (
    <StickyBar className="flex flex-wrap items-center justify-between gap-3 print:hidden">
      <div className="min-w-0 space-y-1">
        <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Report preview · as your client sees it</p>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="truncate text-xl font-semibold">{report.title}</h1>
          <ReportStatusBadge status={report.status} />
        </div>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{report.periodLabel}</span>
          <ShareState share={report.share} />
        </p>
      </div>
      {ready && (
        <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label="Report actions">
          <Button variant="outline" onClick={() => actions.downloadPdf(report)} disabled={actions.downloadingId === report.id}>
            {actions.downloadingId === report.id ? <Loader2 className="animate-spin" /> : <FileDown />}
            Download PDF
          </Button>
          {canCreate && <ShareLinkButton variant="button" report={report} busy={actions.sharingId === report.id} onCopy={(days) => actions.copyLink(report, days)} />}
          {canCreate && report.share && (
            <Button variant="ghost" onClick={onRevoke} className="text-muted-foreground">
              <Link2Off />
              Revoke link
            </Button>
          )}
          {canCreate && (
            <Button onClick={onSend}>
              <Send />
              Send
            </Button>
          )}
          {canDelete && (
            <Button variant="ghost" size="icon" className="text-bad hover:bg-bad-soft hover:text-bad" onClick={onDelete} aria-label="Delete report" title="Delete">
              <Trash2 />
            </Button>
          )}
        </div>
      )}
      {!ready && canDelete && (
        <Button variant="ghost" className="text-bad hover:bg-bad-soft hover:text-bad" onClick={onDelete}>
          <Trash2 />
          Delete
        </Button>
      )}
    </StickyBar>
  );
}
