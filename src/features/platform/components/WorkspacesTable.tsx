import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/table/DataTable';
import type { Sort } from '@/types/sort';
import type { WorkspaceSortKey, WorkspaceUsage } from '../types';
import { workspaceColumns } from './workspaceColumns';

interface Props {
  rows: WorkspaceUsage[];
  sort: Sort<WorkspaceSortKey>;
  onSort: (key: WorkspaceSortKey) => void;
  onEditLimit: (row: WorkspaceUsage) => void;
}

/** Every customer workspace's rank-tracking usage and cost; Edit limit opens the drawer. */
export function WorkspacesTable({ rows, sort, onSort, onEditLimit }: Props) {
  return (
    <DataTable
      rows={rows}
      columns={workspaceColumns}
      rowLabel={(w) => w.name}
      noun="workspaces"
      sort={sort}
      onSort={onSort}
      actions={{
        extra: (w) => (
          <Button
            variant="ghost"
            size="icon"
            className="size-6 text-primary hover:text-primary/80"
            onClick={() => onEditLimit(w)}
            aria-label={`Edit keyword limit for ${w.name}`}
            title="Edit limit"
          >
            <SlidersHorizontal className="size-3.5" />
          </Button>
        ),
      }}
    />
  );
}
