import { CircleCheck, CircleSlash, Loader2, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BulkUserAction } from '../types';

interface UsersBulkBarProps {
  count: number;
  canUpdate: boolean;
  canDelete: boolean;
  /** The action running now, if any. */
  pending?: BulkUserAction;
  onAction: (action: BulkUserAction) => void;
  onClear: () => void;
}

/** Shown above the table while users are selected. */
export function UsersBulkBar({ count, canUpdate, canDelete, pending, onAction, onClear }: UsersBulkBarProps) {
  const busy = Boolean(pending);
  const icon = (action: BulkUserAction, Icon: typeof Trash2) => (pending === action ? <Loader2 className="animate-spin" /> : <Icon />);

  return (
    <div role="region" aria-label="Bulk actions" className="flex flex-wrap items-center gap-2 rounded border border-primary/30 bg-accent/60 px-3 py-1.5">
      <span className="text-sm font-medium tabular-nums">{count} selected</span>
      <div className="ml-auto flex flex-wrap items-center gap-1.5">
        {canUpdate && (
          <>
            <Button variant="outline" size="sm" disabled={busy} onClick={() => onAction('enable')}>
              {icon('enable', CircleCheck)}
              Enable
            </Button>
            <Button variant="outline" size="sm" disabled={busy} onClick={() => onAction('disable')}>
              {icon('disable', CircleSlash)}
              Disable
            </Button>
          </>
        )}
        {canDelete && (
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            className="text-bad hover:bg-bad-soft hover:text-bad"
            onClick={() => onAction('delete')}
          >
            {icon('delete', Trash2)}
            Delete
          </Button>
        )}
        <Button variant="ghost" size="sm" disabled={busy} onClick={onClear}>
          <X />
          Clear
        </Button>
      </div>
    </div>
  );
}
