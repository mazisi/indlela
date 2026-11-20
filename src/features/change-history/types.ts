import type { ChangeEntry, FieldChange } from '@/types/history';

/** One field on Settings › Change history, with the page's own label for it. */
export interface LabelledChange extends FieldChange {
  label: string;
}

/** One audit entry on Settings › Change history (the API's ChangeEntryResource). */
export interface ChangeHistoryEntry extends Omit<ChangeEntry, 'changes'> {
  /** The page the record belongs to, e.g. "Sites". */
  page: string | null;
  pageKey: string | null;
  /** What the record is, e.g. "Site", "Monthly report". */
  recordType: string | null;
  changes: LabelledChange[];
  /** Whether this user may undo it now; otherwise `reason` says why (null when they lack the permission or it's undone). */
  undo: { available: boolean; reason: string | null };
  undoneAt: string | null;
  undoneBy: string | null;
  /** The entry this one undid, when it was an Undo. */
  undoOf: number | null;
}

export type ChangeAction = 'create' | 'update' | 'delete' | 'restore';

export interface ChangeHistoryFilters {
  pageKey?: string;
  /** A user id, or "system" for seeds and jobs. */
  user?: string;
  action?: ChangeAction;
  search?: string;
  /** yyyy-mm-dd */
  from?: string;
  to?: string;
}

export interface ChangeHistoryQuery extends ChangeHistoryFilters {
  page: number;
  perPage: number;
}

export interface ChangeHistoryOptions {
  pages: { key: string; label: string }[];
  users: { id: number | 'system'; name: string }[];
}
