import { CheckCircle2, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { Combobox } from '@/components/form/Combobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { COMPARE_OPTIONS, RANGE_PRESETS, type RangeKey } from '../lib/dateRange';
import { describeSync } from '../lib/syncStatus';
import type { CompareMode, GscSite } from '../types';

/** "Site · Client", searchable by site, client and address; unlinked sites are marked. */
export function SitePicker({ sites, value, onChange }: { sites: GscSite[]; value: number | undefined; onChange: (id: number) => void }) {
  const options = [...sites]
    .sort((a, b) => (a.client?.name ?? '').localeCompare(b.client?.name ?? '') || a.name.localeCompare(b.name))
    .map((s) => ({
      value: String(s.id),
      label: `${s.client ? `${s.client.name} · ` : ''}${s.name}${s.gscProperty ? '' : ' (not linked)'}`,
      keywords: s.url,
    }));
  return (
    <Combobox
      options={options}
      value={value ? String(value) : ''}
      onChange={(v) => onChange(Number(v))}
      aria-label="Site"
      placeholder="Choose a site"
      searchPlaceholder="Search sites or clients…"
      emptyText="No site matches."
      className="h-9 bg-card sm:w-72"
    />
  );
}

export function RangeSelect({ value, onChange, disabled }: { value: RangeKey; onChange: (r: RangeKey) => void; disabled?: boolean }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as RangeKey)} disabled={disabled}>
      <SelectTrigger aria-label="Date range" className="h-9 w-40 bg-card">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {RANGE_PRESETS.map((p) => (
          <SelectItem key={p.key} value={p.key}>
            {p.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function CompareSelect({ value, onChange, disabled }: { value: CompareMode; onChange: (c: CompareMode) => void; disabled?: boolean }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as CompareMode)} disabled={disabled}>
      <SelectTrigger aria-label="Compare with" className="h-9 w-48 bg-card">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {COMPARE_OPTIONS.map((o) => (
          <SelectItem key={o.key} value={o.key}>
            {o.key === 'none' ? o.label : `vs ${o.label.toLowerCase()}`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const SYNC_TONE = {
  ok: { box: 'border-ok/25 bg-ok-soft text-ok', icon: CheckCircle2 },
  busy: { box: 'border-primary/25 bg-accent text-primary', icon: Loader2 },
  bad: { box: 'border-bad/30 bg-bad-soft text-bad', icon: AlertCircle },
  idle: { box: 'border-border bg-muted text-muted-foreground', icon: Clock },
} as const;

/** "Synced 2 h ago · data through 18/11/2026", "Syncing…" or "Failed: …". */
export function SyncStatusBadge({ site }: { site: GscSite }) {
  const view = describeSync(site);
  const { box, icon: Icon } = SYNC_TONE[view.tone];
  return (
    <span
      role="status"
      title={view.detail ?? view.label}
      className={cn('inline-flex h-7 max-w-full items-center gap-1.5 rounded border px-2 text-xs font-medium', box)}
    >
      <Icon className={cn('size-3.5 shrink-0', view.tone === 'busy' && 'animate-spin')} aria-hidden />
      <span className="truncate">{view.label}</span>
    </span>
  );
}
