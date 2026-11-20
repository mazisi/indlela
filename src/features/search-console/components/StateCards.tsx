import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { AlertCircle, BarChart3, Globe, Loader2, Lock, MousePointerClick, RefreshCw, Search, Sparkles, TrendingDown, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/utils/formatDate';
import { propertyLabel } from '../lib/properties';
import type { GscSite } from '../types';
import { LinkPropertyForm } from './LinkPropertyForm';

/** The frame every non-dashboard state sits in: an icon, a title, a line of text and whatever comes next. */
function StateCard({ icon: Icon, tone = 'primary', title, children }: { icon: LucideIcon; tone?: 'primary' | 'bad'; title: string; children: ReactNode }) {
  return (
    <section className="rounded border bg-card px-6 py-10 shadow-xs sm:px-10" aria-labelledby="sc-state-title">
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <span className={`flex size-12 items-center justify-center rounded-full ${tone === 'bad' ? 'bg-bad-soft text-bad' : 'bg-accent text-primary'}`}>
          <Icon className="size-5" aria-hidden />
        </span>
        <h2 id="sc-state-title" className="mt-3 text-lg font-semibold">
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
}

const BENEFITS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: BarChart3, title: 'Clicks and rankings', text: 'Clicks, impressions, CTR and average position by page and by search.' },
  { icon: Sparkles, title: 'Quick wins', text: 'Searches you rank 5–15 for with lots of impressions: the cheapest traffic to win.' },
  { icon: MousePointerClick, title: 'Low CTR', text: 'Pages that rank well but get few clicks: their title or description needs work.' },
  { icon: TrendingDown, title: 'Content decay', text: 'Pages losing traffic month over month, before the drop gets serious.' },
];

export function ConnectState({ canConnect, connecting, onConnect }: { canConnect: boolean; connecting: boolean; onConnect: () => void }) {
  return (
    <StateCard icon={Search} title="Connect Google Search Console">
      <p className="mt-1 max-w-lg text-sm text-muted-foreground">
        See how your clients' sites perform in Google Search, and the reports most clients have never seen. Connect once for the workspace, then link each site to its property.
      </p>
      <ul className="mt-6 grid w-full gap-3 text-left sm:grid-cols-2">
        {BENEFITS.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex gap-3 rounded border bg-background/60 p-3">
            <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <span>
              <span className="block text-sm font-semibold">{title}</span>
              <span className="block text-xs text-muted-foreground">{text}</span>
            </span>
          </li>
        ))}
      </ul>
      {canConnect ? (
        <>
          <Button className="mt-6" onClick={onConnect} disabled={connecting}>
            {connecting ? <Loader2 className="animate-spin" /> : <Search />}
            Connect Google Search Console
          </Button>
          <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="size-3" aria-hidden />
            Read-only access: Indlela never changes anything in Search Console.
          </p>
        </>
      ) : (
        <p className="mt-6 rounded border border-dashed px-3 py-2 text-sm text-muted-foreground">
          Search Console isn't connected yet. Ask someone who manages this workspace to connect it.
        </p>
      )}
    </StateCard>
  );
}

export function NoSitesState() {
  return (
    <StateCard icon={Globe} title="No sites yet">
      <p className="mt-1 max-w-md text-sm text-muted-foreground">Add your clients' websites first; then link each one to its Search Console property here.</p>
      <Button asChild variant="outline" className="mt-5">
        <Link to="/dashboard/clients/sites">Go to Sites</Link>
      </Button>
    </StateCard>
  );
}

export function NotLinkedState({ site, canLink }: { site: GscSite; canLink: boolean }) {
  return (
    <StateCard icon={Globe} title={`Link ${site.name} to Search Console`}>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        Choose the Search Console property for <span className="font-medium text-foreground">{site.url}</span>. We import up to 16 months of data, then keep it up to date every day.
      </p>
      {canLink ? (
        <div className="mt-5 w-full max-w-md text-left">
          <LinkPropertyForm site={site} />
        </div>
      ) : (
        <p className="mt-5 rounded border border-dashed px-3 py-2 text-sm text-muted-foreground">This site isn't linked yet. Ask someone who manages this workspace to link it.</p>
      )}
    </StateCard>
  );
}

export function ImportingState({ site }: { site: GscSite }) {
  const property = site.gscProperty ? propertyLabel(site.gscProperty).name : site.url;
  return (
    <StateCard icon={RefreshCw} title="Importing up to 16 months of data…">
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        We're pulling {property}'s clicks, impressions and rankings from Google. This usually takes a minute or two; the page updates by itself when it's done.
      </p>
      <div className="mt-5 h-1.5 w-56 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Importing" aria-busy="true">
        <div className="h-full w-1/3 animate-[sc-indeterminate_1.4s_ease-in-out_infinite] rounded-full bg-primary" />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{site.gscSyncStatus === 'queued' ? 'Waiting in the queue' : 'Import running'}</p>
    </StateCard>
  );
}

export function ImportFailedState({ site, canSync, syncing, onSync }: { site: GscSite; canSync: boolean; syncing: boolean; onSync: () => void }) {
  return (
    <StateCard icon={AlertCircle} tone="bad" title="The import didn't finish">
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        {site.gscSyncError ?? 'Google did not return the data.'}
        {site.gscSyncedAt && ` Last attempt ${formatDate(site.gscSyncedAt)}.`}
      </p>
      {canSync && (
        <Button className="mt-5" onClick={onSync} disabled={syncing}>
          {syncing ? <Loader2 className="animate-spin" /> : <RefreshCw />}
          Try again
        </Button>
      )}
    </StateCard>
  );
}
