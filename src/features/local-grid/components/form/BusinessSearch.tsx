import { useId, useState, type KeyboardEvent } from 'react';
import { Check, Loader2, MapPin, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatNumber } from '@/features/search-console/lib/format';
import { getApiErrorMessage } from '@/utils/formErrorHandler';
import { useBusinessSearch } from '../../hooks/useLocalGrid';
import { apiErrorOf } from '../../lib/errors';
import { searchBlocked } from '../../lib/usage';
import { businessSearchSchema } from '../../schemas/gridSchema';
import type { BusinessCandidate, GridBusiness, LocalGridUsage } from '../../types';
import { Rating } from '../cells';

interface Props {
  siteId: number;
  value: GridBusiness | null;
  onChange: (business: GridBusiness | null) => void;
  usage: LocalGridUsage | undefined;
  /** The form's error on `business`. */
  error?: string;
}

const toBusiness = (c: BusinessCandidate): GridBusiness => ({ title: c.title, placeId: c.placeId, cid: c.cid, address: c.address, lat: c.lat, lng: c.lng });

/**
 * Find the business's Google Maps listing: type its name, Search (one of
 * today's searches), pick a result. The chosen listing shows as a card that
 * can be changed.
 */
export function BusinessSearch({ siteId, value, onChange, usage, error }: Props) {
  const id = useId();
  const search = useBusinessSearch(siteId);
  const [query, setQuery] = useState('');
  const [queryError, setQueryError] = useState<string>();
  const [results, setResults] = useState<BusinessCandidate[]>();
  const [failure, setFailure] = useState<string>();
  const blocked = searchBlocked(usage);

  const run = () => {
    const parsed = businessSearchSchema.safeParse(query);
    if (!parsed.success) {
      setQueryError(parsed.error.issues[0]?.message);
      return;
    }
    setQueryError(undefined);
    setFailure(undefined);
    search.mutate(
      { query: parsed.data },
      {
        onSuccess: (found) => setResults(found),
        onError: (e) => {
          const { status } = apiErrorOf(e);
          const errors = (e as { response?: { data?: { errors?: Record<string, string[]> } } }).response?.data?.errors;
          if (status === 422 && errors?.query?.[0]) setQueryError(errors.query[0]);
          else setFailure(getApiErrorMessage(e, status === 429 ? "You've used today's business searches." : status === 409 ? 'Business search is paused for now.' : 'The search did not work. Try again in a moment.'));
        },
      },
    );
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Enter searches; it must not submit the drawer's form.
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!blocked && !search.isPending) run();
    }
  };

  if (value) {
    return (
      <div className="space-y-1.5">
        <p className="text-sm font-medium text-foreground">Business</p>
        <div className="flex items-start gap-3 rounded border border-primary/40 bg-accent/40 p-3" data-testid="chosen-business">
          <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{value.title}</p>
            {value.address && <p className="truncate text-xs text-muted-foreground">{value.address}</p>}
          </div>
          <Button type="button" variant="ghost" size="sm" className="h-7 shrink-0 px-2 text-xs" onClick={() => onChange(null)}>
            <X className="size-3.5" />
            Change
          </Button>
        </div>
      </div>
    );
  }

  const inputId = `${id}-query`;
  const describedBy = queryError || error ? `${inputId}-error` : `${inputId}-hint`;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-0.5">
          <label htmlFor={inputId} className="text-sm font-medium text-foreground">
            Business
          </label>
          <span className="text-sm leading-none text-destructive" aria-hidden>
            *
          </span>
        </span>
        {usage && (
          <span className="text-xs tabular-nums text-muted-foreground" data-testid="searches-today">
            Searches today {formatNumber(usage.searchesToday.used)} of {formatNumber(usage.searchesToday.limit)}
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            id={inputId}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="e.g. Karoo Coffee Sandton"
            autoComplete="off"
            className="pl-9"
            aria-required
            aria-invalid={queryError || error ? true : undefined}
            aria-describedby={describedBy}
          />
        </div>
        <Button type="button" variant="outline" onClick={run} disabled={search.isPending || Boolean(blocked)}>
          {search.isPending && <Loader2 className="animate-spin" />}
          Search
        </Button>
      </div>
      {queryError || error ? (
        <p id={`${inputId}-error`} role="alert" className="text-xs text-destructive">
          {queryError ?? error}
        </p>
      ) : (
        <p id={`${inputId}-hint`} className="text-xs text-muted-foreground">
          {blocked ?? 'Its name as on Google Maps, with the suburb or city. Each search uses one of today’s searches.'}
        </p>
      )}
      {failure && (
        <p role="alert" className="rounded border border-warn/30 bg-warn-soft px-3 py-2 text-xs text-warn">
          {failure}
        </p>
      )}

      {results && (
        <div aria-live="polite">
          {results.length === 0 ? (
            <p className="rounded border border-dashed px-3 py-3 text-center text-sm text-muted-foreground">No listings found. Try the name as it shows on Google Maps, with the suburb.</p>
          ) : (
            <ul className="max-h-72 space-y-1.5 overflow-y-auto" aria-label="Listings found">
              {results.map((c, i) => (
                <li key={c.placeId ?? c.cid ?? i}>
                  <button
                    type="button"
                    onClick={() => onChange(toBusiness(c))}
                    className="group flex w-full items-start gap-3 rounded border bg-card p-2.5 text-left transition-colors hover:border-primary/40 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Choose ${c.title}${c.address ? `, ${c.address}` : ''}`}
                  >
                    <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground group-hover:text-primary" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{c.title}</span>
                      {c.address && <span className="block truncate text-xs text-muted-foreground">{c.address}</span>}
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <Rating rating={c.rating} votes={c.votes} />
                        {c.category && <span className="text-xs text-muted-foreground">{c.category}</span>}
                        {c.domain && <span className="text-xs text-muted-foreground">{c.domain}</span>}
                      </span>
                    </span>
                    <Check className="mt-0.5 size-4 shrink-0 text-primary opacity-0 group-hover:opacity-100" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
