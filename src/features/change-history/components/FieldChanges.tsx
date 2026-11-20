import { showValue, visibleChanges } from '../lib/format';
import type { ChangeHistoryEntry } from '../types';

/** Every field of an entry in full: before and after for a change, the value set or removed otherwise. */
export function FieldChanges({ entry }: { entry: ChangeHistoryEntry }) {
  const changes = visibleChanges(entry);
  if (changes.length === 0) return <p className="text-sm text-muted-foreground">No field details were recorded for this entry.</p>;
  const update = entry.action === 'update';

  return (
    <div className="overflow-hidden rounded border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
          <tr>
            <th scope="col" className="w-36 px-3 py-2">Field</th>
            {update && <th scope="col" className="px-3 py-2">Before</th>}
            <th scope="col" className="px-3 py-2">{update ? 'After' : entry.action === 'delete' ? 'Value removed' : 'Value'}</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {changes.map((c) => (
            <tr key={c.field} className="align-top">
              <th scope="row" className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">{c.label}</th>
              {update && <td className="break-words px-3 py-2 text-muted-foreground line-through decoration-muted-foreground/50">{showValue(c.old)}</td>}
              <td className="break-words px-3 py-2 font-medium">{showValue(update || entry.action !== 'delete' ? c.new : c.old)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
