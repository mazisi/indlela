import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/form/Combobox';
import { DateInput } from '@/components/ui/date-input';
import { ACTION_LABEL } from '../lib/format';
import type { ChangeAction, ChangeHistoryOptions } from '../types';

const ACTIONS: ChangeAction[] = ['update', 'create', 'delete', 'restore'];

const ALL = 'all';

export interface FilterValues {
  module?: string;
  user?: string;
  action?: string;
  from?: string;
  to?: string;
}

interface Props {
  searchInput: string;
  onSearchInput: (value: string) => void;
  values: FilterValues;
  options: ChangeHistoryOptions | undefined;
  onChange: (changes: Partial<Record<keyof FilterValues, string | undefined>>) => void;
  onClear: (() => void) | null;
}

/** Search, page, user, kind of change and a date range; every filter lives in the URL. */
export function HistoryFilters({ searchInput, onSearchInput, values, options, onChange, onClear }: Props) {
  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-end">
      <div className="relative lg:w-72">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          type="search"
          value={searchInput}
          onChange={(e) => onSearchInput(e.target.value)}
          placeholder="Search record, value or user"
          aria-label="Search record, value or user"
          className="bg-card pl-9"
        />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex">
        <Combobox
          aria-label="Filter by page"
          className="lg:w-52"
          value={values.module ?? ALL}
          onChange={(v) => onChange({ module: v === ALL ? undefined : v })}
          options={[{ value: ALL, label: 'All pages' }, ...(options?.pages ?? []).map((p) => ({ value: p.key, label: p.label }))]}
          searchPlaceholder="Search pages…"
          emptyText="No page matches."
        />
        <Combobox
          aria-label="Filter by user"
          className="lg:w-48"
          value={values.user ?? ALL}
          onChange={(v) => onChange({ user: v === ALL ? undefined : v })}
          options={[{ value: ALL, label: 'All users' }, ...(options?.users ?? []).map((u) => ({ value: String(u.id), label: u.name }))]}
          searchPlaceholder="Search users…"
          emptyText="No user matches."
        />
        <Combobox
          aria-label="Filter by change"
          className="lg:w-40"
          value={values.action ?? ALL}
          onChange={(v) => onChange({ action: v === ALL ? undefined : v })}
          options={[{ value: ALL, label: 'All changes' }, ...ACTIONS.map((a) => ({ value: a, label: ACTION_LABEL[a] }))]}
          searchPlaceholder="Search…"
          emptyText="No match."
        />
      </div>
      <div className="grid grid-cols-2 gap-2 lg:flex lg:items-center">
        <div className="flex items-center gap-2">
          <Label htmlFor="ch-from" className="shrink-0 text-xs text-muted-foreground">
            From
          </Label>
          <DateInput id="ch-from" value={values.from ?? ''} max={values.to} onChange={(e) => onChange({ from: e.target.value || undefined })} className="lg:w-36" />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="ch-to" className="shrink-0 text-xs text-muted-foreground">
            To
          </Label>
          <DateInput id="ch-to" value={values.to ?? ''} min={values.from} onChange={(e) => onChange({ to: e.target.value || undefined })} className="lg:w-36" />
        </div>
      </div>
      {onClear && (
        <Button variant="ghost" size="sm" className="self-start lg:self-auto" onClick={onClear}>
          <X />
          Clear filters
        </Button>
      )}
    </div>
  );
}
