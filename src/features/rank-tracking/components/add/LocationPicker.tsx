import { useState } from 'react';
import { Check, Loader2, MapPin, Plus, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FormField } from '@/features/auth/components/FormField';
import { fieldAria } from '@/features/auth/lib/fieldAria';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { cn } from '@/lib/utils';
import { getApiErrorMessage } from '@/utils/formErrorHandler';
import { useLocationSearch } from '../../hooks/useRankTracking';
import { formatCoordinate, parseCoordinate } from '../../lib/coordinates';
import { coordinateLocationSchema } from '../../schemas/addKeywordsSchema';
import type { NewKeywordLocation, RankLocation } from '../../types';

interface Props {
  id: string;
  value: NewKeywordLocation[];
  onChange: (value: NewKeywordLocation[]) => void;
  error?: string;
}

const keyOf = (l: NewKeywordLocation) => (l.type === 'code' ? `code:${l.code}` : `coord:${l.coordinate}`);

/** Location search (409 `rank_checks_paused` while checks are on hold: the API's message, coordinates still work): country, region or city by name (two letters or more). */
function LocationSearch({ id, selected, onPick, invalid }: { id: string; selected: NewKeywordLocation[]; onPick: (l: RankLocation) => void; invalid: boolean }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const term = useDebouncedValue(search.trim(), 300);
  const results = useLocationSearch(term, open);
  const chosen = new Set(selected.map(keyOf));

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button type="button" id={id} variant="outline" role="combobox" aria-expanded={open} aria-invalid={invalid || undefined} className={cn('w-full justify-start font-normal text-muted-foreground', invalid && 'border-bad')}>
          <Search className="size-4 opacity-60" aria-hidden />
          Search a country, region or city…
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-64 p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="e.g. Johannesburg" value={search} onValueChange={setSearch} aria-label="Search locations" />
          <CommandList>
            {term.length === 1 ? (
              <p className="px-3 py-4 text-center text-xs text-muted-foreground">Type at least two letters.</p>
            ) : results.isError ? (
              <p className="px-3 py-4 text-center text-xs text-bad" role="alert">
                {getApiErrorMessage(results.error, 'We could not search locations.')} You can still add a suburb by coordinates below.
              </p>
            ) : results.isPending || (results.isFetching && results.isPlaceholderData) ? (
              <p className="flex items-center justify-center gap-2 px-3 py-4 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
                Searching…
              </p>
            ) : (
              <>
                <CommandEmpty>No locations match “{term}”.</CommandEmpty>
                <CommandGroup heading={term ? undefined : 'Suggested'}>
                  {results.data?.map((l) => {
                    const picked = chosen.has(`code:${l.code}`);
                    return (
                      <CommandItem key={l.code} value={String(l.code)} onSelect={() => onPick(l)} disabled={picked}>
                        <Check className={cn('size-4', picked ? 'opacity-100' : 'opacity-0')} aria-hidden />
                        <span className="min-w-0 flex-1 truncate">{l.name}</span>
                        <span className="text-2xs text-muted-foreground">{l.type}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/** "Add a suburb by coordinates": a name and "lat, lng", validated before it joins the list. */
function CoordinateEntry({ id, onAdd, taken }: { id: string; onAdd: (l: NewKeywordLocation) => void; taken: Set<string> }) {
  const [name, setName] = useState('');
  const [coordinate, setCoordinate] = useState('');
  const [errors, setErrors] = useState<{ name?: string; coordinate?: string }>({});

  const add = () => {
    const parsed = coordinateLocationSchema.safeParse({ name, coordinate });
    if (!parsed.success) {
      const message = (field: string) => parsed.error.issues.find((i) => i.path[0] === field)?.message;
      setErrors({ name: message('name'), coordinate: message('coordinate') });
      return;
    }
    const point = parseCoordinate(parsed.data.coordinate);
    if (!point) return;
    const location: NewKeywordLocation = { type: 'coordinate', coordinate: formatCoordinate(point), name: parsed.data.name };
    if (taken.has(keyOf(location))) {
      setErrors({ coordinate: 'That point is already in the list.' });
      return;
    }
    onAdd(location);
    setName('');
    setCoordinate('');
    setErrors({});
  };

  return (
    <div className="space-y-2 rounded border bg-muted/30 p-3">
      <p className="flex items-center gap-1.5 text-sm font-medium">
        <MapPin className="size-3.5 text-primary" aria-hidden />
        Add a suburb by coordinates
      </p>
      <p className="text-xs text-muted-foreground">For a suburb the search doesn't list: Google is searched as if from that point. Copy the point from Google Maps (right-click the map).</p>
      <div className="grid gap-2 sm:grid-cols-[1fr_1.2fr_auto] sm:items-start">
        <FormField id={`${id}-name`} label="Name" error={errors.name}>
          <Input {...fieldAria(`${id}-name`, errors.name)} value={name} onChange={(e) => setName(e.target.value)} placeholder="Sandton" autoComplete="off" />
        </FormField>
        <FormField id={`${id}-point`} label="Latitude, longitude" error={errors.coordinate}>
          <Input
            {...fieldAria(`${id}-point`, errors.coordinate)}
            value={coordinate}
            onChange={(e) => setCoordinate(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                add();
              }
            }}
            placeholder="-26.1076, 28.0567"
            inputMode="decimal"
            autoComplete="off"
          />
        </FormField>
        <Button type="button" variant="outline" className="sm:mt-6" onClick={add}>
          <Plus />
          Add
        </Button>
      </div>
    </div>
  );
}

/** The locations to track in: picked from the location search, or a suburb by coordinates. */
export function LocationPicker({ id, value, onChange, error }: Props) {
  const taken = new Set(value.map(keyOf));
  const add = (l: NewKeywordLocation) => !taken.has(keyOf(l)) && onChange([...value, l]);

  return (
    <div className="space-y-2">
      <FormField id={id} label="Locations" error={error} required hint="Country, city or suburb. Each location is tracked separately.">
        <LocationSearch id={id} selected={value} invalid={Boolean(error)} onPick={(l) => add({ type: 'code', code: l.code, name: l.name })} />
      </FormField>
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Chosen locations">
          {value.map((l) => (
            <li key={keyOf(l)} className="inline-flex items-center gap-1 rounded border bg-card py-0.5 pl-2 pr-0.5 text-xs">
              {l.type === 'coordinate' && <MapPin className="size-3 text-muted-foreground" aria-hidden />}
              <span className="font-medium">{l.name}</span>
              {l.type === 'coordinate' && <span className="text-muted-foreground tabular-nums">{l.coordinate}</span>}
              <button
                type="button"
                className="grid size-5 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => onChange(value.filter((v) => keyOf(v) !== keyOf(l)))}
                aria-label={`Remove ${l.name}`}
              >
                <X className="size-3" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      <CoordinateEntry id={`${id}-coord`} onAdd={add} taken={taken} />
    </div>
  );
}
