import { Eye, Loader2, MoreHorizontal, Pencil, PauseCircle, PlayCircle, Trash2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { gridScanBlocked } from '../../lib/usage';
import type { Grid } from '../../types';

export interface GridMenuAccess {
  canUpdate: boolean;
  canDelete: boolean;
  /** Why Scan now can't run workspace-wide (paused, none left today), or null. */
  scanBlocked: string | null;
}

interface Props extends GridMenuAccess {
  grid: Grid;
  busy: boolean;
  onOpen: () => void;
  onScan: () => void;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}

/** A grid row's actions in one "…" menu: open, Scan now, edit, pause/resume and delete, each with its permission. */
export function GridRowMenu({ grid, busy, canUpdate, canDelete, scanBlocked, onOpen, onScan, onEdit, onToggleActive, onDelete }: Props) {
  const blocked = gridScanBlocked(grid, scanBlocked);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-6 text-muted-foreground hover:text-foreground" aria-label={`Actions for ${grid.keyword}`} title="Actions">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onSelect={onOpen}>
          <Eye aria-hidden />
          Open heatmap
        </DropdownMenuItem>
        {canUpdate && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={busy || Boolean(blocked)} onSelect={onScan}>
              {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Zap aria-hidden />}
              Scan now
            </DropdownMenuItem>
            {blocked && <DropdownMenuLabel className="-mt-1 pl-8 text-2xs font-normal text-muted-foreground">{blocked}</DropdownMenuLabel>}
            <DropdownMenuItem onSelect={onEdit}>
              <Pencil aria-hidden />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onToggleActive}>
              {grid.isActive ? <PauseCircle aria-hidden /> : <PlayCircle aria-hidden />}
              {grid.isActive ? 'Pause' : 'Resume'}
            </DropdownMenuItem>
          </>
        )}
        {canDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              <Trash2 aria-hidden />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
