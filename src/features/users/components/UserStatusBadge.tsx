import { cn } from '@/lib/utils';
import type { UserStatus } from '../types';

const TONE: Record<UserStatus, { pill: string; dot: string }> = {
  active: { pill: 'bg-ok-soft text-ok', dot: 'bg-ok' },
  locked: { pill: 'bg-bad-soft text-bad', dot: 'bg-bad' },
  disabled: { pill: 'bg-secondary text-muted-foreground', dot: 'bg-muted-foreground/60' },
};

export function UserStatusBadge({ status, label }: { status: UserStatus; label: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded px-1.5 py-0.5 text-2xs font-semibold', TONE[status].pill)}>
      <span className={cn('size-1.5 rounded-full', TONE[status].dot)} aria-hidden />
      {label}
    </span>
  );
}
