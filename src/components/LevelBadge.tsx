import { LEVEL_LABELS, type Level } from '@/config/modules';
import { cn } from '@/lib/utils';

const TONE: Record<Level, string> = {
  none: 'bg-secondary text-muted-foreground',
  view: 'bg-secondary text-foreground',
  edit: 'bg-accent text-primary',
  approve: 'bg-ok-soft text-ok',
};

export function LevelBadge({ level }: { level: Level }) {
  return <span className={cn('inline-flex rounded px-1.5 py-0.5 text-2xs font-semibold uppercase tracking-wide', TONE[level])}>{LEVEL_LABELS[level]}</span>;
}
