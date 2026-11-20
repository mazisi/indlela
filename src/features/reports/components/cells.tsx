import { AlertCircle, CheckCircle2, Link2, Loader2, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/formatDate';
import type { ReportRow, ReportShare, ReportStatus } from '../types';

const pill = 'inline-flex items-center gap-1 whitespace-nowrap rounded px-1.5 py-0.5 text-2xs font-semibold';

const STATUS: Record<ReportStatus, { label: string; className: string; icon: typeof Loader2 }> = {
  generating: { label: 'Generating', className: 'bg-accent text-primary', icon: Loader2 },
  ready: { label: 'Ready', className: 'bg-ok-soft text-ok', icon: CheckCircle2 },
  failed: { label: 'Failed', className: 'bg-bad-soft text-bad', icon: AlertCircle },
};

/** Generating (spinning), Ready or Failed, with its icon (never colour alone). */
export function ReportStatusBadge({ status, className }: { status: ReportStatus; className?: string }) {
  const s = STATUS[status];
  const Icon = s.icon;
  return (
    <span className={cn(pill, s.className, className)} data-status={status}>
      <Icon className={cn('size-3', status === 'generating' && 'animate-spin motion-reduce:animate-none')} aria-hidden />
      {s.label}
      {status === 'generating' && '…'}
    </span>
  );
}

/** The status, with a failed report's reason underneath. */
export function ReportStatusCell({ report }: { report: Pick<ReportRow, 'status' | 'error'> }) {
  return (
    <span className="flex max-w-56 flex-col items-start gap-0.5">
      <ReportStatusBadge status={report.status} />
      {report.status === 'failed' && report.error && <span className="line-clamp-2 whitespace-normal text-xs text-bad">{report.error}</span>}
    </span>
  );
}

const isExpired = (share: ReportShare) => Boolean(share.expiresAt && new Date(share.expiresAt).getTime() < Date.now());

/** "Shared · until 20/12/2026", "Shared · no expiry", "Link expired" or "Not shared". */
export function ShareState({ share }: { share: ReportShare | null }) {
  if (!share) return <span className="text-xs text-muted-foreground">Not shared</span>;
  if (isExpired(share)) return <span className="text-xs text-muted-foreground">Link expired</span>;
  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <Link2 className="size-3.5 shrink-0 text-primary" aria-hidden />
      <span>
        <span className="font-medium">Shared</span>
        <span className="text-muted-foreground"> · {share.expiresAt ? `until ${formatDate(share.expiresAt)}` : 'no expiry'}</span>
      </span>
    </span>
  );
}

/** Who it was emailed to and when. */
export function SentTo({ report }: { report: Pick<ReportRow, 'sentAt' | 'sentTo'> }) {
  const to = report.sentTo ?? [];
  if (!report.sentAt || to.length === 0) return <span className="text-xs text-muted-foreground">Not sent</span>;
  return (
    <span className="flex min-w-0 max-w-56 flex-col text-xs" title={to.join(', ')}>
      <span className="flex items-center gap-1 truncate">
        <Mail className="size-3.5 shrink-0 text-primary" aria-hidden />
        <span className="truncate font-medium">{to[0]}</span>
        {to.length > 1 && <span className="shrink-0 text-muted-foreground">+{to.length - 1}</span>}
      </span>
      <span className="text-muted-foreground">{formatDate(report.sentAt)}</span>
    </span>
  );
}

/** Small markers beside the last report on the overview. */
export function DeliveryMarkers({ report }: { report: ReportRow }) {
  const live = report.share && !isExpired(report.share);
  if (!report.sentAt && !live) return null;
  return (
    <span className="inline-flex items-center gap-1">
      {report.sentAt && (
        <span className={cn(pill, 'bg-secondary text-muted-foreground')} title={`Sent ${formatDate(report.sentAt)}${report.sentTo?.length ? ` to ${report.sentTo.join(', ')}` : ''}`}>
          <Mail className="size-3" aria-hidden />
          Sent
        </span>
      )}
      {live && (
        <span className={cn(pill, 'bg-secondary text-muted-foreground')} title="A share link is live">
          <Link2 className="size-3" aria-hidden />
          Shared
        </span>
      )}
    </span>
  );
}
