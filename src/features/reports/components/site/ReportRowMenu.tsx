import { Eye, FileDown, Link2, Link2Off, Loader2, MoreHorizontal, Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ReportActions } from '../../hooks/useReportActions';
import type { ReportRow, ShareExpiry } from '../../types';

/** How long a new share link lasts (same choices as the preview's Share button). */
const EXPIRY: { days: ShareExpiry; label: string }[] = [
  { days: 7, label: 'Expires in 7 days' },
  { days: 30, label: 'Expires in 30 days' },
  { days: 90, label: 'Expires in 90 days' },
  { days: null, label: 'Never expires' },
];

interface Props {
  report: ReportRow;
  canCreate: boolean;
  canDelete: boolean;
  actions: ReportActions;
  onView: () => void;
  onSend: () => void;
  onRevoke: () => void;
  onDelete: () => void;
}

/**
 * A report row's actions in one "…" menu: view, download, share link
 * (copy, or create with an expiry), revoke, send and delete. Each item
 * follows the report's status and the user's permissions; with nothing to
 * offer (e.g. still generating, view-only) there is no menu.
 */
export function ReportRowMenu({ report, canCreate, canDelete, actions, onView, onSend, onRevoke, onDelete }: Props) {
  const ready = report.status === 'ready';
  const downloading = actions.downloadingId === report.id;
  const sharing = actions.sharingId === report.id;
  const main = ready;
  const sharingItems = canCreate && (ready || Boolean(report.share));
  if (!main && !sharingItems && !canDelete) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-6 text-muted-foreground hover:text-foreground" aria-label={`Actions for ${report.title}`} title="Actions">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {ready && (
          <>
            <DropdownMenuItem onSelect={onView}>
              <Eye aria-hidden />
              View
            </DropdownMenuItem>
            <DropdownMenuItem disabled={downloading} onSelect={() => actions.downloadPdf(report)}>
              {downloading ? <Loader2 className="animate-spin" aria-hidden /> : <FileDown aria-hidden />}
              Download PDF
            </DropdownMenuItem>
          </>
        )}

        {sharingItems && (
          <>
            {ready && <DropdownMenuSeparator />}
            {ready &&
              (report.share ? (
                <DropdownMenuItem disabled={sharing} onSelect={() => void actions.copyLink(report)}>
                  <Link2 aria-hidden />
                  Copy share link
                </DropdownMenuItem>
              ) : (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger disabled={sharing}>
                    <Link2 aria-hidden />
                    Create share link
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {EXPIRY.map((e) => (
                      <DropdownMenuItem key={e.label} onSelect={() => void actions.copyLink(report, e.days)}>
                        {e.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ))}
            {report.share && (
              <DropdownMenuItem onSelect={onRevoke}>
                <Link2Off aria-hidden />
                Revoke share link
              </DropdownMenuItem>
            )}
            {ready && (
              <DropdownMenuItem onSelect={onSend}>
                <Send aria-hidden />
                Send by email
              </DropdownMenuItem>
            )}
          </>
        )}

        {canDelete && (
          <>
            {(main || sharingItems) && <DropdownMenuSeparator />}
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              <Trash2 aria-hidden />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
