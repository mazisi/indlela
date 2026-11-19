import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { TableHead } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { Sort } from '@/types/sort';
import { TABLE_HEAD } from './tableStyles';

interface SortableHeadProps<K extends string> {
  label: string;
  sortKey: K;
  sort?: Sort<K>;
  onSort: (key: K) => void;
  className?: string;
}

/** A column header that drives a sort: server-side (`useUrlSort`) or of rows already in the browser (`useClientSort`). */
export function SortableHead<K extends string>({ label, sortKey, sort, onSort, className }: SortableHeadProps<K>) {
  const active = sort?.key === sortKey;
  const Icon = !active ? ChevronsUpDown : sort.direction === 'asc' ? ArrowUp : ArrowDown;
  return (
    <TableHead
      className={cn(TABLE_HEAD, className)}
      aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn('-mx-1 inline-flex items-center gap-1 rounded px-1 uppercase hover:text-foreground', active && 'text-foreground')}
        title={`Sort by ${label.toLowerCase()}`}
      >
        {label}
        <Icon className={cn('size-3', active ? 'opacity-100' : 'opacity-40')} aria-hidden />
      </button>
    </TableHead>
  );
}
