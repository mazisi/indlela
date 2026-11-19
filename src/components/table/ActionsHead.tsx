import { TableHead } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { TABLE_HEAD } from './tableStyles';

/** The right-aligned "Actions" column header for row buttons. */
export function ActionsHead({ label = 'Actions', className }: { label?: string; className?: string }) {
  return <TableHead className={cn(TABLE_HEAD, 'w-px whitespace-nowrap text-right', className)}>{label}</TableHead>;
}
