import { cn } from '@/lib/utils';
import { ACTION_DOT, ACTION_LABEL, summaryOf, visibleChanges } from '../lib/format';
import type { ChangeHistoryEntry } from '../types';

/** Fields in the one-line summary; the row's drawer has them all. */
const SUMMARY = 3;

/** One line: what happened (with Undo / Undone marks) and the first fields. */
export function ChangeCell({ entry }: { entry: ChangeHistoryEntry }) {
  const changes = visibleChanges(entry);
  const more = changes.length - SUMMARY;
  const summary = changes
    .slice(0, SUMMARY)
    .map((c) => summaryOf(entry, c))
    .join(' · ');

  return (
    <p className="flex min-w-0 items-center gap-1.5 text-xs">
      <span className={cn('size-1.5 shrink-0 rounded-full', ACTION_DOT[entry.action])} aria-hidden />
      <span className="shrink-0 font-medium">{ACTION_LABEL[entry.action]}</span>
      {entry.undoOf !== null && <span className="shrink-0 rounded bg-accent px-1.5 py-px text-2xs font-semibold text-primary">Undo</span>}
      {entry.undoneAt && <span className="shrink-0 rounded bg-muted px-1.5 py-px text-2xs font-semibold text-muted-foreground">Undone</span>}
      {summary && (
        <span className="truncate text-muted-foreground">
          {summary}
          {more > 0 && ` · +${more} more`}
        </span>
      )}
    </p>
  );
}
