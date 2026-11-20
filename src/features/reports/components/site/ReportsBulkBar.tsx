import { useState } from 'react';
import { Link2Off, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { ActiveBulkBar } from '@/components/table/ActiveBulkBar';
import type { RowSelection } from '@/hooks/useRowSelection';
import showToaster from '@/utils/showToaster';
import { getApiErrorMessage } from '@/utils/formErrorHandler';
import { useBulkReports } from '../../hooks/useReports';
import type { ReportBulkAction, ReportRow } from '../../types';

interface Props {
  siteId: number;
  /** The page's rows (to count the selected ones with a link). */
  rows: ReportRow[];
  selection: RowSelection<number>;
  canCreate: boolean;
  canDelete: boolean;
}

const reports = (n: number) => (n === 1 ? '1 report' : `${n} reports`);

const CONFIRM: Record<ReportBulkAction, { title: (n: number) => string; description: (n: number) => string; label: string }> = {
  unshare: {
    title: (n) => `Revoke ${n === 1 ? 'the share link' : `${n} share links`}?`,
    description: (n) => `Anyone who opens ${n === 1 ? 'the link' : 'these links'} will see that the report is no longer available. You can create new links afterwards.`,
    label: 'Revoke links',
  },
  delete: {
    title: (n) => `Delete ${reports(n)}?`,
    description: (n) => `${n === 1 ? 'The report and its PDF are' : `The ${n} reports and their PDFs are`} deleted, and any share links stop working. This can't be undone.`,
    label: 'Delete',
  },
};

/**
 * Shown above the reports while some are selected: revoke their share
 * links (create_reports) and delete them (delete_reports), each after a
 * confirmation. Generating reports can't be selected.
 */
export function ReportsBulkBar({ siteId, rows, selection, canCreate, canDelete }: Props) {
  const bulk = useBulkReports(siteId);
  const [pending, setPending] = useState<{ action: ReportBulkAction; ids: number[] }>();
  const shared = rows.filter((r) => selection.isSelected(r.id) && r.share).map((r) => r.id);

  const run = async () => {
    if (!pending) return;
    try {
      const { affected } = await bulk.mutateAsync(pending);
      showToaster('success', pending.action === 'delete' ? `${reports(affected)} deleted.` : `${affected === 1 ? '1 share link' : `${affected} share links`} revoked.`);
      selection.clear();
      setPending(undefined);
    } catch (error) {
      showToaster('error', getApiErrorMessage(error, 'Could not update the selected reports.'));
    }
  };

  const running = bulk.isPending ? bulk.variables?.action : undefined;
  const n = pending?.ids.length ?? 0;

  return (
    <>
      <ActiveBulkBar
        count={selection.count}
        canUpdate={false}
        canDelete={canDelete}
        pending={running === 'delete' ? 'delete' : undefined}
        onAction={() => setPending({ action: 'delete', ids: selection.ids })}
        onClear={selection.clear}
      >
        {canCreate && (
          <Button
            variant="outline"
            size="sm"
            disabled={bulk.isPending || shared.length === 0}
            title={shared.length === 0 ? 'None of the selected reports has a share link' : undefined}
            onClick={() => setPending({ action: 'unshare', ids: shared })}
          >
            {running === 'unshare' ? <Loader2 className="animate-spin" /> : <Link2Off />}
            Revoke share links{shared.length > 0 && ` (${shared.length})`}
          </Button>
        )}
      </ActiveBulkBar>

      <ConfirmationDialog
        open={Boolean(pending)}
        onOpenChange={(o) => !o && !bulk.isPending && setPending(undefined)}
        title={pending ? CONFIRM[pending.action].title(n) : ''}
        description={pending ? CONFIRM[pending.action].description(n) : ''}
        confirmLabel={pending ? CONFIRM[pending.action].label : 'Confirm'}
        variant="danger"
        isLoading={bulk.isPending}
        onConfirm={() => void run()}
      />
    </>
  );
}
