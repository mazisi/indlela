import { useState } from 'react';
import { Loader2, Play, Settings2, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { useCancelRun } from '../hooks/useAuditRun';
import type { Audit } from '../types';
import { AuditProgress } from './AuditProgress';

interface Props {
  /** The audit under way, if any. */
  running: Audit | undefined;
  canManage: boolean;
  starting: boolean;
  onRun: () => void;
  onSettings: () => void;
  /** Off where the page shows its own Run button (first audit, failed audit). */
  showRun?: boolean;
  showProgress?: boolean;
}

/**
 * The page header's audit controls: progress while an audit runs (with
 * Cancel, after confirming), otherwise Run audit; and Settings. View-only
 * users see the progress only.
 */
export function RunControls({ running, canManage, starting, onRun, onSettings, showRun = true, showProgress = true }: Props) {
  const [confirming, setConfirming] = useState(false);
  const { stop, cancelling } = useCancelRun();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {running && showProgress && <AuditProgress audit={running} compact className="mr-1 w-52" />}
      {canManage && (
        <>
          <Button variant="outline" className="h-9 bg-card" onClick={onSettings}>
            <Settings2 />
            Settings
          </Button>
          {running ? (
            <Button variant="outline" className="h-9 bg-card text-bad hover:bg-bad-soft hover:text-bad" onClick={() => setConfirming(true)}>
              <Square className="size-3.5 fill-current" />
              Cancel audit
            </Button>
          ) : (
            showRun && <Button className="h-9" onClick={onRun} disabled={starting}>
              {starting ? <Loader2 className="animate-spin" /> : <Play />}
              Run audit
            </Button>
          )}
          {running && (
            <ConfirmationDialog
              open={confirming}
              onOpenChange={setConfirming}
              title="Cancel this audit?"
              description="The crawl stops and nothing from this run is kept. The latest finished audit stays as it is."
              confirmLabel="Cancel audit"
              cancelLabel="Keep running"
              variant="danger"
              isLoading={cancelling}
              onConfirm={() => stop(running, () => setConfirming(false))}
            />
          )}
        </>
      )}
    </div>
  );
}
