import type { ReactNode } from 'react';
import { CircleCheck, CircleSlash, Loader2, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type ActiveBulkAction = 'activate' | 'deactivate' | 'delete';

interface ActiveBulkBarProps {
  count: number;
  canUpdate: boolean;
  canDelete: boolean;
  /** The action running now, if any. */
  pending?: ActiveBulkAction;
  onAction: (action: ActiveBulkAction) => void;
  onClear: () => void;
  /** More actions for this table, before Delete. */
  children?: ReactNode;
}

/** Shown above a settings table while rows are selected: activate, deactivate, delete. */
export function ActiveBulkBar({ count, canUpdate, canDelete, pending, onAction, onClear, children }: ActiveBulkBarProps) {
  const busy = Boolean(pending);
  const icon = (action: ActiveBulkAction, Icon: typeof Trash2) =>
    pending === action ? <Loader2 className="animate-spin" /> : <Icon />;

  return (
    <div role="region" aria-label="Bulk actions" className="flex flex-wrap items-center gap-2 rounded border border-primary/30 bg-accent/60 px-3 py-1.5">
      <span className="text-sm font-medium tabular-nums">
        {count} selected
      </span>
      <div className="ml-auto flex flex-wrap items-center gap-1.5">
        {canUpdate && (
          <>
            <Button variant="outline" size="sm" disabled={busy} onClick={() => onAction('activate')}>
              {icon('activate', CircleCheck)}
              Activate
            </Button>
            <Button variant="outline" size="sm" disabled={busy} onClick={() => onAction('deactivate')}>
              {icon('deactivate', CircleSlash)}
              Deactivate
            </Button>
          </>
        )}
        {children}
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
