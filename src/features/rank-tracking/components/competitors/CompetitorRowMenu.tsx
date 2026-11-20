import { Loader2, MoreHorizontal, PauseCircle, Pencil, PlayCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Competitor } from '../../types';

interface Props {
  competitor: Competitor;
  busy: boolean;
  onRename: () => void;
  onToggleActive: () => void;
  onRemove: () => void;
}

/** A competitor's actions in one "…" menu: rename, pause/resume, remove (managers only). */
export function CompetitorRowMenu({ competitor, busy, onRename, onToggleActive, onRemove }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-6 text-muted-foreground hover:text-foreground" aria-label={`Actions for ${competitor.name}`} title="Actions">
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <MoreHorizontal className="size-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onSelect={onRename}>
          <Pencil aria-hidden />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem disabled={busy} onSelect={onToggleActive}>
          {competitor.isActive ? <PauseCircle aria-hidden /> : <PlayCircle aria-hidden />}
          {competitor.isActive ? 'Pause' : 'Resume'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={onRemove}>
          <Trash2 aria-hidden />
          Remove
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
