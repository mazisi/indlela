import { Search, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BUCKETS, DEVICE_LABEL } from '../../lib/position';
import type { Bucket, Device } from '../../types';

const ALL = 'all';

interface Props {
  searchInput: string;
  onSearchInput: (v: string) => void;
  device: Device | undefined;
  location: string | undefined;
  tag: string | undefined;
  bucket: Bucket | undefined;
  /** Key keywords only. */
  keyOnly: boolean;
  locations: string[];
  tags: string[];
  /** Sets one filter (undefined clears it), back on page 1. */
  onFilter: (key: 'device' | 'location' | 'tag' | 'bucket' | 'key', value: string | undefined) => void;
}

function FilterSelect({ label, value, all, options, onChange, width = 'w-40' }: { label: string; value: string | undefined; all: string; options: { value: string; label: string }[]; onChange: (v: string | undefined) => void; width?: string }) {
  return (
    <Select value={value ?? ALL} onValueChange={(v) => onChange(v === ALL ? undefined : v)}>
      <SelectTrigger aria-label={label} className={`h-9 bg-card ${width}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{all}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** The Keywords tab's toolbar: search, device, location, tag, position bucket and key keywords (all in the URL). */
export function KeywordFilters({ searchInput, onSearchInput, device, location, tag, bucket, keyOnly, locations, tags, onFilter }: Props) {
  const withCurrent = (list: string[], current: string | undefined) => (current && !list.includes(current) ? [...list, current] : list);
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative sm:w-72">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input type="search" value={searchInput} onChange={(e) => onSearchInput(e.target.value)} placeholder="Search keywords" aria-label="Search keywords" className="bg-card pl-9" />
      </div>
      <FilterSelect
        label="Device"
        value={device}
        all="All devices"
        width="w-36"
        options={(Object.keys(DEVICE_LABEL) as Device[]).map((d) => ({ value: d, label: DEVICE_LABEL[d] }))}
        onChange={(v) => onFilter('device', v)}
      />
      <FilterSelect label="Location" value={location} all="All locations" options={withCurrent(locations, location).map((l) => ({ value: l, label: l }))} onChange={(v) => onFilter('location', v)} />
      {(tags.length > 0 || tag) && <FilterSelect label="Tag" value={tag} all="All tags" width="w-36" options={withCurrent(tags, tag).map((t) => ({ value: t, label: t }))} onChange={(v) => onFilter('tag', v)} />}
      <FilterSelect label="Position" value={bucket} all="Any position" width="w-36" options={BUCKETS} onChange={(v) => onFilter('bucket', v)} />
      <Button
        type="button"
        variant="outline"
        aria-pressed={keyOnly}
        onClick={() => onFilter('key', keyOnly ? undefined : '1')}
        className={cn('h-9 bg-card', keyOnly && 'border-warn/50 bg-warn-soft text-warn hover:bg-warn-soft hover:text-warn')}
      >
        <Star className={cn(keyOnly && 'fill-warn')} aria-hidden />
        Key keywords
      </Button>
    </div>
  );
}
