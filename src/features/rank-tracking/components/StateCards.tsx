import { Link } from 'react-router';
import { AlertCircle, CalendarClock, Copy, Globe, LineChart, MapPin, PauseCircle, Plus, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StateCard, StateCardPoints } from '@/components/page/StateCard';

export function NoSitesState() {
  return (
    <StateCard icon={Globe} title="No sites to track yet">
      <p className="mt-1 max-w-md text-sm text-muted-foreground">Add your clients' websites first; you can then track where each one ranks in Google for the searches that matter.</p>
      <Button asChild variant="outline" className="mt-5">
        <Link to="/dashboard/clients/sites">Go to Sites</Link>
      </Button>
    </StateCard>
  );
}

export function SiteNotFoundState() {
  return (
    <StateCard icon={AlertCircle} tone="bad" title="Site not found">
      <p className="mt-1 max-w-md text-sm text-muted-foreground">This site doesn't exist or you don't have access to it.</p>
      <Button asChild variant="outline" className="mt-5">
        <Link to="/dashboard/rank-tracking">Back to Rank tracking</Link>
      </Button>
    </StateCard>
  );
}

const WHAT_YOU_GET = [
  { icon: MapPin, title: 'Local and national', text: 'Track by country, city or suburb, on desktop and mobile, the way your clients’ customers search.' },
  { icon: LineChart, title: 'Position history', text: 'Every check is kept: see the trend, best position, and the biggest gains and drops each week.' },
  { icon: Copy, title: 'Cannibalisation', text: 'We record which page ranks, so two of the site’s pages competing for one search stand out.' },
  { icon: Sparkles, title: 'SERP features', text: 'Featured snippets, the map pack and AI overviews: whether they show, and whether the site is in them.' },
];

export function NoKeywordsState({ canAdd, onAdd }: { canAdd: boolean; onAdd: () => void }) {
  return (
    <StateCard icon={TrendingUp} title="Add your first keywords">
      <p className="mt-1 max-w-lg text-sm text-muted-foreground">Choose the searches this site should be found for, and where. We check where it ranks daily or weekly, and show what changed.</p>
      <StateCardPoints points={WHAT_YOU_GET} />
      {canAdd ? (
        <Button className="mt-6" onClick={onAdd}>
          <Plus />
          Add keywords
        </Button>
      ) : (
        <p className="mt-6 rounded border border-dashed px-3 py-2 text-sm text-muted-foreground">No keywords are tracked for this site yet. Ask your account manager to add some.</p>
      )}
    </StateCard>
  );
}

/** Every keyword is paused: nothing is checked, so there's no summary. */
export function AllPausedNotice() {
  return (
    <section className="flex gap-3 rounded border bg-card p-4 shadow-xs" aria-labelledby="rank-paused-title">
      <PauseCircle className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
      <div className="space-y-1 text-sm">
        <h2 id="rank-paused-title" className="font-semibold">
          All keywords are paused
        </h2>
        <p className="text-muted-foreground">Paused keywords aren't checked and don't count towards your keyword limit. Select keywords below and activate them to start tracking again.</p>
      </div>
    </section>
  );
}

/** Keywords added, none checked yet. */
export function NoChecksYetNotice({ canCheck }: { canCheck: boolean }) {
  return (
    <section className="flex gap-3 rounded border border-primary/20 bg-accent/50 p-4" aria-labelledby="rank-first-check-title">
      <CalendarClock className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
      <div className="space-y-1 text-sm">
        <h2 id="rank-first-check-title" className="font-semibold">
          First positions arrive after tonight's check
        </h2>
        <p className="text-muted-foreground">
          The summary, trends and biggest movers fill in once the keywords have been checked.
          {canCheck && (
            <>
              {' '}
              Can't wait? Use <Zap className="inline size-3.5 align-[-2px] text-primary" aria-hidden /> <span className="font-medium text-foreground">Check now</span> on a keyword for its position in
              a minute or so.
            </>
          )}
        </p>
      </div>
    </section>
  );
}
