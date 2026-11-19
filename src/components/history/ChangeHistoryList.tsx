import { History } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/utils/formatDate';
import { cn } from '@/lib/utils';
import type { ResourcePage } from '@/types/pagination';
import type { ChangeEntry, FieldChange } from '@/types/history';

const ACTION: Record<ChangeEntry['action'], { label: string; dot: string }> = {
  create: { label: 'Added', dot: 'bg-ok' },
  update: { label: 'Changed', dot: 'bg-primary' },
  delete: { label: 'Removed', dot: 'bg-bad' },
  view: { label: 'Viewed', dot: 'bg-warn' },
};

const show = (v: FieldChange['old']) => (v === null || v === '' ? '—' : typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v));

function ChangeList({ entry, fieldLabels }: { entry: ChangeEntry; fieldLabels: Record<string, string> }) {
  // Additions list what was set; changes show old → new, skipping ones that read the same.
  const changes = entry.changes.filter(
    (c) =>
      c.field in fieldLabels &&
      (entry.action === 'create' ? show(c.new) !== '—' : entry.action === 'delete' || show(c.old) !== show(c.new)),
  );
  if (changes.length === 0) return null;
  return (
    <dl className="mt-1.5 space-y-1 text-xs">
      {changes.map((c) => (
        <div key={c.field} className="grid grid-cols-[8.5rem_1fr] gap-2">
          <dt className="text-muted-foreground">{fieldLabels[c.field]}</dt>
          <dd className="min-w-0 break-words">
            {entry.action === 'update' ? (
              <>
                <span className="text-muted-foreground line-through decoration-muted-foreground/50">{show(c.old)}</span>
                <span className="mx-1.5 text-muted-foreground" aria-hidden>
                  →
                </span>
                <span className="sr-only"> changed to </span>
                <span className="font-medium">{show(c.new)}</span>
              </>
            ) : (
              <span className="font-medium">{show(entry.action === 'delete' ? c.old : c.new)}</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

interface EntriesProps {
  history: ResourcePage<ChangeEntry> | undefined;
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
  /** Column → label, e.g. { universal_branch_code: 'Universal branch code' }. */
  fieldLabels: Record<string, string>;
  /** The empty state's line. */
  emptyText?: string;
}

/** The entries of a change history, newest first: who did what, when, and what changed. */
export function ChangeHistoryEntries({ history, isPending, isError, onRetry, fieldLabels, emptyText = 'Additions and edits on this page will be listed here.' }: EntriesProps) {
  const entries = history?.data ?? [];

  return (
    <>
    {isError ? (
      <div className="space-y-2 text-sm">
        <p>We could not load the history.</p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      </div>
    ) : isPending ? (
      <ol className="space-y-4" aria-busy="true" aria-label="Loading history">
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i} className="space-y-1.5 border-l-2 pl-3">
            <Skeleton className="h-3.5 w-40 rounded" />
            <Skeleton className="h-3 w-28 rounded" />
            <Skeleton className="h-3 w-52 rounded" />
          </li>
        ))}
      </ol>
    ) : entries.length === 0 ? (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <History className="size-6 text-muted-foreground" aria-hidden />
        <p className="text-sm font-medium">No changes yet</p>
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      </div>
    ) : (
      <ol className="space-y-4">
        {entries.map((e) => (
          <li key={e.id} className="relative border-l-2 border-border pl-4">
            <span className={cn('absolute -left-[5px] top-1.5 size-2 rounded-full', ACTION[e.action].dot)} aria-hidden />
            <p className="text-sm">
              <span className="font-medium">{ACTION[e.action].label}</span>
              {e.recordLabel && <span className="font-semibold"> {e.recordLabel}</span>}
            </p>
            <p className="text-xs text-muted-foreground">
              <span className="font-mono tabular-nums">{formatDateTime(e.at)}</span> · {e.user}
            </p>
            <ChangeList entry={e} fieldLabels={fieldLabels} />
          </li>
        ))}
      </ol>
    )}
    </>
  );
}

/** Newer / older pages of a change history (shown when there is more than one). */
export function ChangeHistoryPager({ history, onPageChange }: { history: ResourcePage<ChangeEntry> | undefined; onPageChange: (page: number) => void }) {
  const meta = history?.meta;
  if (!meta || meta.lastPage <= 1) return null;

  return (
  
    <div className="flex items-center justify-between gap-2 border-t p-3 text-xs text-muted-foreground">
      <span className="tabular-nums">
        {meta.from}–{meta.to} of {meta.total}
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={meta.currentPage <= 1} onClick={() => onPageChange(meta.currentPage - 1)}>
          Newer
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={meta.currentPage >= meta.lastPage}
          onClick={() => onPageChange(meta.currentPage + 1)}
        >
          Older
        </Button>
      </div>
    </div>
  );
}
