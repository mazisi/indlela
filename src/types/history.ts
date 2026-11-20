/** One row of a page's change history (the API's ChangeHistoryResource). */
export interface ChangeEntry {
  id: number;
  at: string;
  /** `view`: someone looked at something logged when seen, e.g. a contractor's full account number. */
  /** `restore`: a deleted record brought back (Settings › Change history's Undo). */
  action: 'create' | 'update' | 'delete' | 'restore' | 'view';
  /** Who made the change; "System" for seeds and jobs. */
  user: string;
  recordId: string;
  /** Name of the record, when it has one. */
  recordLabel: string | null;
  changes: FieldChange[];
}

export interface FieldChange {
  /** API column name (snake_case — values inside the array aren't key-transformed). */
  field: string;
  old: FieldValue;
  new: FieldValue;
}

/** A logged value: lists (sections, recipients, tags) come as arrays. */
export type FieldValue = string | number | boolean | string[] | null;
