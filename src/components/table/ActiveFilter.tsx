import { cn } from '@/lib/utils';

export type ActiveFilterValue = 'active' | 'inactive';

const TABS: { value: ActiveFilterValue | undefined; label: string }[] = [
  { value: undefined, label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

interface ActiveFilterProps {
  value: ActiveFilterValue | undefined;
  /** The list's `summary` (ignores the status filter). */
  summary?: { active: number; total: number };
  onChange: (value: ActiveFilterValue | undefined) => void;
}

/** All / Active / Inactive with counts, for settings lists with an Active flag (segmented control, as on Users). */
export function ActiveFilter({ value, summary, onChange }: ActiveFilterProps) {
  const counts = summary && { all: summary.total, active: summary.active, inactive: summary.total - summary.active };
  return (
    <div role="group" aria-label="Filter by status" className="inline-flex flex-wrap self-start rounded border bg-card p-0.5">
      {TABS.map((t) => {
        const on = t.value === value;
        const count = counts?.[t.value ?? 'all'];
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
