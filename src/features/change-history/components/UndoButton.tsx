import { Loader2, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ChangeHistoryEntry } from '../types';

interface Props {
  entry: ChangeHistoryEntry;
  busy: boolean;
  onUndo: (entry: ChangeHistoryEntry) => void;
}

/**
 * A row's Undo: offered when the API says it can be done, greyed out with
 * the reason when it can't (e.g. adding a record is undone by deleting it),
 * and left out for users without the permission or entries already undone.
 */
export function UndoButton({ entry, busy, onUndo }: Props) {
  if (!entry.undo.available && !entry.undo.reason) return null;
  const label = `Undo ${entry.action === 'delete' ? 'removing' : 'this change to'} ${entry.recordLabel ?? `#${entry.recordId}`}`;

  const tip = entry.undo.available ? (entry.action === 'delete' ? 'Bring it back' : 'Put the old values back') : (entry.undo.reason ?? undefined);

  // A disabled button shows no tooltip, so the reason sits on its wrapper (and is read out with the button).
  return (
    <span title={tip} className="inline-flex">
      <Button
        variant="ghost"
        size="icon"
        className="size-6 text-primary hover:text-primary/80 disabled:text-muted-foreground"
        disabled={!entry.undo.available || busy}
        aria-label={label}
        aria-description={entry.undo.available ? undefined : (entry.undo.reason ?? undefined)}
        onClick={() => onUndo(entry)}
      >
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Undo2 className="size-3.5" />}
      </Button>
    </span>
  );
}
