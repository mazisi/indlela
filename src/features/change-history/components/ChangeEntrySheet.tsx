import type { ReactNode } from 'react';
import { Loader2, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/utils/formatDate';
import { ACTION_DOT, ACTION_LABEL } from '../lib/format';
import type { ChangeHistoryEntry } from '../types';
import { FieldChanges } from './FieldChanges';

interface Props {
  entry: ChangeHistoryEntry | undefined;
  onClose: () => void;
  busy: boolean;
  onUndo: (entry: ChangeHistoryEntry) => void;
}

function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm">{children}</dd>
    </div>
  );
}

/** One entry in full: who, when, where, every field before and after, and its Undo (or why it can't be undone). */
export function ChangeEntrySheet({ entry, onClose, busy, onUndo }: Props) {
  return (
    <Sheet open={Boolean(entry)} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-xl">
        {entry && (
          <>
            <SheetHeader className="border-b pr-10">
              <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Change history{entry.page ? ` · ${entry.page}` : ''}</p>
              <SheetTitle className="text-lg">{entry.recordLabel ?? `#${entry.recordId}`}</SheetTitle>
              <SheetDescription className="flex items-center gap-1.5">
                <span className={cn('size-1.5 rounded-full', ACTION_DOT[entry.action])} aria-hidden />
                {ACTION_LABEL[entry.action]}
                {entry.recordType && <span>· {entry.recordType}</span>}
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 space-y-5 overflow-y-auto p-4">
              <dl className="grid grid-cols-2 gap-4 rounded border bg-muted/30 p-3">
                <Meta label="When">{formatDateTime(entry.at)}</Meta>
                <Meta label="By">{entry.user}</Meta>
                {entry.undoOf !== null && <Meta label="Undo of">An earlier change (entry #{entry.undoOf})</Meta>}
                {entry.undoneAt && (
                  <Meta label="Undone">
                    {formatDateTime(entry.undoneAt)} by {entry.undoneBy ?? 'someone'}
                  </Meta>
                )}
              </dl>

              <section className="space-y-2" aria-label="Fields">
                <h3 className="text-sm font-semibold">{entry.action === 'update' ? 'What changed' : 'Details'}</h3>
                <FieldChanges entry={entry} />
              </section>

              {!entry.undo.available && entry.undo.reason && (
                <p className="rounded border border-dashed px-3 py-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Can't be undone here.</span> {entry.undo.reason}
                </p>
              )}
            </div>

            <SheetFooter className="flex-row justify-end">
              <SheetClose asChild>
                <Button type="button" variant="outline">
                  Close
                </Button>
              </SheetClose>
              {entry.undo.available && (
                <Button type="button" disabled={busy} onClick={() => onUndo(entry)}>
                  {busy ? <Loader2 className="animate-spin" /> : <Undo2 />}
                  {entry.action === 'delete' ? 'Bring it back' : 'Undo this change'}
                </Button>
              )}
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
