import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { History, Search, X } from 'lucide-react';
import { Head } from '@/components/ui/Head';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/page/PageHeader';
import { Paginator } from '@/components/Paginator';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { FormAlert } from '@/features/auth/components/FormAlert';
import { LoginHistoryTable, LoginHistoryTableSkeleton } from '../components/LoginHistoryTable';
import { useLoginHistory } from '../hooks/useLoginHistory';
import { LOGIN_EVENT_OPTIONS } from '../lib/loginEvents';
import type { LoginEventType } from '../types';
import { DEFAULT_PER_PAGE } from '@/types/pagination';

const ALL_EVENTS = 'all';

/**
 * Settings › Login history (Owners only). Every
 * sign-in, wrong password, lockout, reset and sign-up. Filters and page
 * live in the URL so a filtered view can be shared or bookmarked.
 */
export default function LoginHistoryPage() {
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page')) || 1;
  const perPage = Number(params.get('perPage')) || DEFAULT_PER_PAGE;
  const event = (params.get('event') as LoginEventType | null) ?? undefined;

  // The box updates instantly; the URL (and the request) follow once typing pauses.
  const [searchInput, setSearchInput] = useState(params.get('search') ?? '');
  const search = useDebouncedValue(searchInput.trim(), 350);

  const update = (changes: Record<string, string | number | undefined>) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(changes).forEach(([key, value]) =>
          value === undefined || value === '' ? next.delete(key) : next.set(key, String(value)),
        );
        return next;
      },
      { replace: true },
    );
  };

  // Keep the URL in step with the debounced search, restarting at page 1.
  if (search !== (params.get('search') ?? '')) {
    update({ search: search || undefined, page: undefined });
  }

  const query = useLoginHistory({ page, perPage, search: params.get('search') ?? undefined, event });
  const events = query.data?.data ?? [];
  const meta = query.data?.meta;
  const filtered = Boolean(params.get('search') || event);

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <Head title="Login history" />
      <PageHeader
        eyebrow="Settings · Owner"
        title="Login history"
        description="Every sign-in, wrong password, lockout, password reset and workspace switch by the people in this workspace."
        actions={
          meta && (
            <span className="inline-flex items-center gap-2 rounded border bg-card px-3 py-1.5 text-sm font-medium">
              <History className="size-4 text-muted-foreground" aria-hidden />
              <span className="tabular-nums">{meta.total.toLocaleString('en-ZA')}</span>
              <span className="text-muted-foreground">{meta.total === 1 ? 'entry' : 'entries'}</span>
            </span>
          )
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name or email"
            aria-label="Search name or email"
            className="pl-9"
          />
        </div>
        <Select value={event ?? ALL_EVENTS} onValueChange={(v) => update({ event: v === ALL_EVENTS ? undefined : v, page: undefined })}>
          <SelectTrigger className="w-full sm:w-56" aria-label="Filter by event">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_EVENTS}>All events</SelectItem>
            {LOGIN_EVENT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filtered && (
          <Button
            variant="ghost"
            size="sm"
            className="self-start sm:self-auto"
            onClick={() => {
              setSearchInput('');
              update({ search: undefined, event: undefined, page: undefined });
            }}
          >
            <X />
            Clear filters
          </Button>
        )}
      </div>

      {query.isError ? (
        <FormAlert tone="error">
          <p>We could not load the login history.</p>
          <p>
            <button type="button" className="font-medium underline" onClick={() => query.refetch()}>
              Try again
            </button>
          </p>
        </FormAlert>
      ) : query.isPending ? (
        <LoginHistoryTableSkeleton />
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded border border-dashed bg-card px-6 py-14 text-center">
          <History className="size-6 text-muted-foreground" aria-hidden />
          <p className="text-sm font-medium">{filtered ? 'Nothing matches these filters' : 'No sign-in activity yet'}</p>
          <p className="text-sm text-muted-foreground">
            {filtered ? 'Try another name, email or event.' : 'Sign-ins, lockouts and resets will be listed here.'}
          </p>
        </div>
      ) : (
        <div className={query.isFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          <LoginHistoryTable events={events} />
          {meta && (
            <Paginator
              currentPage={meta.currentPage}
              lastPage={meta.lastPage}
              totalItems={meta.total}
              perPage={meta.perPage}
              onPageChange={(p) => update({ page: p === 1 ? undefined : p })}
              onPerPageChange={(n) => update({ perPage: n === DEFAULT_PER_PAGE ? undefined : n, page: undefined })}
            />
          )}
        </div>
      )}
    </div>
  );
}
