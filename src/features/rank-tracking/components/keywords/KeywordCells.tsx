import { AlertTriangle, Loader2, Shuffle } from 'lucide-react';
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
