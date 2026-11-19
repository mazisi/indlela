import { cn } from '@/lib/utils';
import type { UserStatus, UsersPage } from '../types';

const TABS: { value: UserStatus | undefined; label: string }[] = [
  { value: undefined, label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'locked', label: 'Locked' },
  { value: 'disabled', label: 'Disabled' },
];

interface UserStatusTabsProps {
  value: UserStatus | undefined;
  summary: UsersPage['summary'] | undefined;
  onChange: (status: UserStatus | undefined) => void;
}

/** Status filter with a count per status (segmented control). */
export function UserStatusTabs({ value, summary, onChange }: UserStatusTabsProps) {
  return (
    <div role="group" aria-label="Filter by status" className="inline-flex flex-wrap rounded border bg-card p-0.5">
      {TABS.map((t) => {
        const on = t.value === value;
        const count = summary?.[t.value ?? 'all'];
        return (
          <button
            key={t.label}
            type="button"
            aria-pressed={on}
            aria-label={count === undefined ? t.label : `${t.label} (${count})`}
            onClick={() => onChange(t.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-sm transition-colors',
              on ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {t.label}
            {count !== undefined && <span className={cn('text-xs tabular-nums', on ? 'opacity-80' : 'opacity-70')}>{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
