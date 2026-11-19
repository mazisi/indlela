import type { MouseEvent, ReactNode } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { RowSelection } from '@/hooks/useRowSelection';
import type { Sort } from '@/types/sort';
import { ActionsHead } from './ActionsHead';
import { SortableHead } from './SortableHead';
import { TABLE_HEAD } from './tableStyles';

export interface DataColumn<T, K extends string> {
  /** Header text; also the field label on phone cards. */
  label: string;
  cell: (row: T) => ReactNode;
  /** Sorts server-side by this key when the header is clicked. */
  sortKey?: K;
  className?: string;
  /** Right-aligns the header and the cells (amounts, rates). */
  align?: 'right';
  /** Skeleton width for this column while loading, e.g. 'w-24'. */
  skeleton?: string;
  /** Left off phone cards, e.g. a status the card already shows as its badge. */
  hideOnCard?: boolean;
  /** Takes the full width of a phone card (e.g. a list of changes). */
  wideOnCard?: boolean;
}

/** What the user may do; omitted for view-only roles. Each is set only with its permission. */
export interface DataRowActions<T> {
  onEdit?: (row: T) => void;
  /** Another icon button between Edit and Delete (e.g. Blacklist). */
  extra?: (row: T) => ReactNode;
  onDelete?: (row: T) => void;
  selection?: RowSelection<number>;
  /** Rows that can't be selected (e.g. a protected row); all by default. */
  canSelect?: (row: T) => boolean;
  /** Rows without an Edit button (e.g. nothing on them can change); all by default. */
  canEdit?: (row: T) => boolean;
  canDelete?: (row: T) => boolean;
}

interface DataTableProps<T extends { id: number }, K extends string> {
  rows: T[];
  columns: DataColumn<T, K>[];
  /** Names the row for screen readers, e.g. "Edit Verbal warning". */
  rowLabel: (row: T) => string;
  /** Plural noun for "Select all … on this page". */
  noun: string;
  /** Top-right of each phone card (e.g. the status pill). */
  cardBadge?: (row: T) => ReactNode;
  /** Dims a row's title (e.g. inactive). */
  muted?: (row: T) => boolean;
  /** Colours a row and its phone card (e.g. someone who has left). */
  rowClassName?: (row: T) => string | undefined;
  actions?: DataRowActions<T>;
  sort?: Sort<K>;
  onSort?: (key: K) => void;
  /**
   * Makes the whole row (and phone card) open the record. Clicks on its own
   * buttons, links and checkboxes still do their own thing; keyboard users
   * keep the row's Open button.
   */
  onRowClick?: (row: T) => void;
}

/**
 * A click on the row itself, not on a control inside it, nor in a menu or
 * dialog it opened (portals bubble through React to the row).
 */
const onRow = (e: MouseEvent<HTMLElement>) =>
  e.currentTarget.contains(e.target as Node) && !(e.target as HTMLElement).closest('button, a, input, label, [role="checkbox"]');

function RowButtons<T>({ row, label, actions }: { row: T; label: string; actions: DataRowActions<T> }) {
  const { onEdit, extra, onDelete, canEdit, canDelete } = actions;
  return (
    <div className="flex items-center justify-end gap-0.5">
      {onEdit && (canEdit?.(row) ?? true) && (
        <Button variant="ghost" size="icon" className="size-6 text-primary hover:text-primary/80" onClick={() => onEdit(row)} aria-label={`Edit ${label}`} title="Edit">
          <Edit className="size-3.5" />
        </Button>
      )}
      {extra?.(row)}
      {onDelete && (canDelete?.(row) ?? true) && (
        <Button
          variant="ghost"
          size="icon"
          className="size-6 text-bad hover:bg-bad-soft hover:text-bad"
          onClick={() => onDelete(row)}
          aria-label={`Delete ${label}`}
          title="Delete"
        >
          <Trash2 className="size-3.5" />
        </Button>
      )}
    </div>
  );
}

/**
 * The house data table: compact table from md up, one card per row below
 * (first column as the card title, the rest as label/value pairs), with
 * optional selection, sortable headers and Edit/Delete row actions.
 */
export function DataTable<T extends { id: number }, K extends string>({
  rows,
  columns,
  rowLabel,
  noun,
  cardBadge,
  muted,
  rowClassName,
  actions,
  sort,
  onSort,
  onRowClick,
}: DataTableProps<T, K>) {
  const selection = actions?.selection;
  const selectable = (row: T) => actions?.canSelect?.(row) ?? true;
  const hasButtons = Boolean(actions?.onEdit || actions?.extra || actions?.onDelete);
  const [title, ...fields] = columns;

  const selectBox = (row: T) =>
    selection && selectable(row) ? (
      <Checkbox checked={selection.isSelected(row.id)} onCheckedChange={() => selection.toggle(row.id)} aria-label={`Select ${rowLabel(row)}`} />
    ) : (
      <span className="inline-block size-4" aria-hidden />
    );
  const selectAll = selection && (
    <Checkbox checked={selection.headerState} onCheckedChange={(v) => selection.toggleAll(v === true)} aria-label={`Select all ${noun} on this page`} />
  );

  return (
    <>
      <div className="hidden rounded border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {selection && <TableHead className="w-10 px-3">{selectAll}</TableHead>}
              {columns.map((c) =>
                c.sortKey && onSort ? (
                  <SortableHead key={c.label} label={c.label} sortKey={c.sortKey} sort={sort} onSort={onSort} className={c.align === 'right' ? 'text-right' : undefined} />
                ) : (
                  <TableHead key={c.label} className={cn(TABLE_HEAD, c.align === 'right' && 'text-right')}>
                    {c.label}
                  </TableHead>
                ),
              )}
              {hasButtons && <ActionsHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={selection?.isSelected(row.id) ? 'selected' : undefined}
                className={cn(rowClassName?.(row), onRowClick && 'cursor-pointer')}
                onClick={onRowClick ? (e) => onRow(e) && onRowClick(row) : undefined}
              >
                {selection && <TableCell className="px-3">{selectBox(row)}</TableCell>}
                {columns.map((c, i) => (
                  <TableCell key={c.label} className={cn('px-3', i === 0 && muted?.(row) && 'text-muted-foreground', c.align === 'right' && 'text-right', c.className)}>
                    {c.cell(row)}
                  </TableCell>
                ))}
                {hasButtons && actions && (
                  <TableCell className="px-3">
                    <RowButtons row={row} label={rowLabel(row)} actions={actions} />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="md:hidden">
        {selection && (
          <label className="mb-2 flex items-center gap-2 px-1">
            {selectAll}
            <span className="text-xs text-muted-foreground">Select all</span>
          </label>
        )}
        <ul className="space-y-2">
          {rows.map((row) => (
            <li
              key={row.id}
              className={cn('rounded border bg-card p-3', rowClassName?.(row), selection?.isSelected(row.id) && 'border-primary/40 bg-accent/40', onRowClick && 'cursor-pointer hover:border-primary/40')}
              onClick={onRowClick ? (e) => onRow(e) && onRowClick(row) : undefined}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-2.5">
                  {selection && <div className="pt-0.5">{selectBox(row)}</div>}
                  <div className={cn('min-w-0', muted?.(row) && 'text-muted-foreground')}>{title.cell(row)}</div>
                </div>
                {cardBadge?.(row)}
              </div>
              <dl className={cn('mt-2 grid grid-cols-2 gap-2', selection && 'pl-6.5')}>
                {fields.filter((c) => !c.hideOnCard).map((c) => (
                  <div key={c.label} className={cn('min-w-0', c.wideOnCard && 'col-span-2')}>
                    <dt className="text-2xs uppercase tracking-wide text-muted-foreground">{c.label}</dt>
                    <dd className="text-sm">{c.cell(row)}</dd>
                  </div>
                ))}
              </dl>
              {hasButtons && actions && (
                <div className="mt-2 border-t pt-2">
                  <RowButtons row={row} label={rowLabel(row)} actions={actions} />
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

/** Loading state with the same columns, and cell shapes from each column's `skeleton` width. */
export function DataTableSkeleton<T, K extends string>({
  columns,
  rows = 6,
  label,
  selectable = true,
  actions = true,
}: {
  columns: DataColumn<T, K>[];
  rows?: number;
  label: string;
  /** The checkbox column; false for tables without row selection. */
  selectable?: boolean;
  /** The Actions column; false for read-only tables. */
  actions?: boolean;
}) {
  return (
    <>
      <div className="hidden rounded border bg-card md:block" aria-busy="true" aria-label={label}>
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && <TableHead className="w-10 px-3" />}
              {columns.map((c) => (
                <TableHead key={c.label} className={cn(TABLE_HEAD, c.align === 'right' && 'text-right')}>
                  {c.label}
                </TableHead>
              ))}
              {actions && <ActionsHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, i) => (
              <TableRow key={i}>
                {selectable && (
                  <TableCell className="px-3">
                    <Skeleton className="size-4 rounded" />
                  </TableCell>
                )}
                {columns.map((c) => (
                  <TableCell key={c.label} className="px-3">
                    <Skeleton className={cn('h-3.5 rounded', c.align === 'right' && 'ml-auto', c.skeleton ?? 'w-24')} />
                  </TableCell>
                ))}
                {actions && (
                  <TableCell className="px-3">
                    <Skeleton className="ml-auto h-6 w-14 rounded" />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ul className="space-y-2 md:hidden" aria-busy="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={i} className="space-y-2 rounded border bg-card p-3">
            <div className="flex justify-between">
              <Skeleton className="h-3.5 w-32 rounded" />
              <Skeleton className="h-4 w-14 rounded" />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Skeleton className="h-3.5 w-24 rounded" />
              <Skeleton className="h-3.5 w-20 rounded" />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
