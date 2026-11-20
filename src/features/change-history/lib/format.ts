import type { ChangeHistoryEntry, LabelledChange } from '../types';

export const ACTION_LABEL: Record<ChangeHistoryEntry['action'], string> = { create: 'Added', update: 'Changed', delete: 'Removed', restore: 'Restored', view: 'Viewed' };

/** A stored date ("2026-10-01 00:00:00") as people read it: 01/10/2026, with the time when there is one. */
const DATE = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::\d{2})?)?/;
function readableDate(text: string): string {
  const m = DATE.exec(text);
  if (!m) return text;
  const day = `${m[3]}/${m[2]}/${m[1]}`;
  return m[4] && `${m[4]}:${m[5]}` !== '00:00' ? `${day} ${m[4]}:${m[5]}` : day;
}

export const showValue = (v: LabelledChange['old']): string =>
  v === null || v === '' ? '—' : typeof v === 'boolean' ? (v ? 'Yes' : 'No') : Array.isArray(v) ? v.join(', ') || '—' : readableDate(String(v));

const LONG = 140;

/** Long values (e.g. an email's message) are cut short in the list; the full text is in the tooltip. */
export const shortValue = (v: LabelledChange['old']): string => {
  const text = showValue(v);
  return text.length > LONG ? `${text.slice(0, LONG - 1)}…` : text;
};

/** What is worth listing: values set on an addition, values removed, and fields whose shown value changed. */
export function visibleChanges(entry: ChangeHistoryEntry): LabelledChange[] {
  return entry.changes.filter((c) =>
    entry.action === 'create' || entry.action === 'restore'
      ? showValue(c.new) !== '—'
      : entry.action === 'delete'
        ? showValue(c.old) !== '—'
        : showValue(c.old) !== showValue(c.new),
  );
}

const SUMMARY_VALUE = 40;

export const ACTION_DOT: Record<ChangeHistoryEntry['action'], string> = { create: 'bg-ok', update: 'bg-primary', delete: 'bg-bad', restore: 'bg-ok', view: 'bg-warn' };

const clip = (text: string) => (text.length > SUMMARY_VALUE ? `${text.slice(0, SUMMARY_VALUE - 1)}…` : text);

/** One field as the summary line reads it: "Name: Old → New", or "Keyword: tent hire". */
export function summaryOf(entry: ChangeHistoryEntry, c: LabelledChange): string {
  if (entry.action === 'update') return `${c.label}: ${clip(showValue(c.old))} → ${clip(showValue(c.new))}`;
  return `${c.label}: ${clip(showValue(entry.action === 'delete' ? c.old : c.new))}`;
}
