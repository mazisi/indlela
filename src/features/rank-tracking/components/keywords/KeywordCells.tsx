import { AlertTriangle, Loader2, Shuffle, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageLink } from '@/features/search-console/components/reports/cells';
import type { RankKeyword } from '../../types';
import { Rank } from '../cells';

export const Muted = ({ children }: { children: string }) => <span className="text-xs text-muted-foreground">{children}</span>;

export function PositionCell({ k }: { k: RankKeyword }) {
  if (k.lastCheckStatus === 'pending') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
        <Loader2 className="size-3 animate-spin" aria-hidden />
        Checking…
      </span>
    );
  }
  if (!k.lastCheckedOn) return <Muted>Not checked</Muted>;
  return <Rank position={k.position} className="text-base" />;
}

export function UrlCell({ k }: { k: RankKeyword }) {
  if (!k.url) return <Muted>—</Muted>;
  return (
    <span className="flex min-w-0 max-w-56 items-center gap-1">
      <PageLink url={k.url} className="min-w-0" />
      {k.urlChanged && (
        <span role="img" aria-label="Ranking URL changed since the last check" title="Ranking URL changed since the last check" className="shrink-0 text-warn">
          <Shuffle className="size-3.5" aria-hidden />
        </span>
      )}
      {k.cannibalised && (
        <span role="img" aria-label="Cannibalisation: more than one of the site's pages ranks" title="Cannibalisation: more than one of the site's pages ranks" className="shrink-0 text-bad">
          <AlertTriangle className="size-3.5" aria-hidden />
        </span>
      )}
    </span>
  );
}

/**
 * The key-keyword star: a toggle for managers (overtake alerts watch key
 * keywords only), a plain mark for everyone else, nothing when not key.
 */
export function KeyStar({ k, busy, onToggle }: { k: RankKeyword; busy?: boolean; onToggle?: (k: RankKeyword) => void }) {
  if (!onToggle) {
    return k.isKey ? (
      <span role="img" aria-label="Key keyword" title="Key keyword" className="shrink-0">
        <Star className="size-3.5 fill-warn text-warn" aria-hidden />
      </span>
    ) : null;
  }
  const label = k.isKey ? `Unmark ${k.keyword} as a key keyword` : `Mark ${k.keyword} as a key keyword`;
  return (
    <button
      type="button"
      onClick={() => onToggle(k)}
      disabled={busy}
      aria-pressed={k.isKey}
      aria-label={label}
      title={k.isKey ? 'Key keyword: competitor overtakes alert you. Click to unmark.' : 'Mark as a key keyword to get competitor overtake alerts.'}
      className="grid size-5 shrink-0 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-warn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
    >
      {busy ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Star className={cn('size-3.5', k.isKey && 'fill-warn text-warn')} aria-hidden />}
    </button>
  );
}
