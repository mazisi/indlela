import { cn } from '@/lib/utils';
import type { NavBadge as Badge } from './useNavCounts';

export function NavBadge({ badge, className }: { badge: Badge | null; className?: string }) {
  if (!badge || badge.count <= 0) return null;
  return (
    <span
      className={cn(
        'inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full px-1.5 font-mono text-2xs font-semibold tabular-nums',
        badge.tone === 'bad' ? 'bg-bad-soft text-bad' : 'bg-secondary text-muted-foreground',
        className,
      )}
    >
      {badge.count > 99 ? '99+' : badge.count}
      <span className="sr-only">{badge.tone === 'bad' ? ' need attention' : ' items'}</span>
    </span>
  );
}
