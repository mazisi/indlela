import { BellRing, Loader2, PieChart, Plus, Swords, Table2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StateCard, StateCardPoints } from '@/components/page/StateCard';
import showToaster from '@/utils/showToaster';
import { getApiErrorMessage } from '@/utils/formErrorHandler';
import { useAddCompetitor, useCompetitorSuggestions } from '../../hooks/useCompetitors';
import { MAX_COMPETITORS } from '../../lib/competitors';
import { SuggestionList } from './SuggestionList';

const WHAT_YOU_GET = [
  { icon: PieChart, title: 'Share of voice', text: 'Who holds the top-10 positions on your keywords, and how that moves week by week.' },
  { icon: Table2, title: 'Head-to-head', text: 'Your position against each competitor on every keyword, with what changed.' },
  { icon: BellRing, title: 'Overtake alerts', text: 'A morning email when a competitor moves above you on a key keyword.' },
  { icon: Swords, title: 'From your checks', text: 'Read from the results your keywords are already checked against: nothing extra to set up.' },
];

interface Props {
  siteId: number;
  keywordsTotal: number;
  canManage: boolean;
  onAdd: () => void;
}

/** No competitors yet: what tracking them gives, Add competitor, and one-click suggestions from the site's results. */
export function CompetitorsEmptyState({ siteId, keywordsTotal, canManage, onAdd }: Props) {
  const suggestions = useCompetitorSuggestions(siteId, canManage);
  const add = useAddCompetitor(siteId);

  const addSuggestion = (domain: string) =>
    add.mutate(
      { domain },
      {
        onSuccess: (c) => showToaster('success', `${c.name} added. Its positions fill in from your recent checks.`),
        onError: (error) => showToaster('error', getApiErrorMessage(error, `Could not add ${domain}.`)),
      },
    );

  return (
    <StateCard icon={Swords} title="See how you stack up against competitors">
      <p className="mt-1 max-w-lg text-sm text-muted-foreground">
        Add up to {MAX_COMPETITORS} competitors and we track them on this site’s keywords: who wins the top 10, where they beat you, and when they overtake you.
      </p>
      <StateCardPoints points={WHAT_YOU_GET} />

      {canManage ? (
        <>
          <Button className="mt-6" onClick={onAdd}>
            <Plus />
            Add competitor
          </Button>

          <div className="mt-8 w-full space-y-2 text-left">
            <h3 className="text-sm font-semibold">Suggested from your results</h3>
            {suggestions.isPending ? (
              <ul className="divide-y rounded border bg-card" aria-busy="true" aria-label="Loading suggestions">
                {[0, 1, 2].map((i) => (
                  <li key={i} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="flex items-center gap-2.5">
                      <Skeleton className="size-7 rounded" />
                      <span className="space-y-1.5">
                        <Skeleton className="h-3.5 w-32 rounded" />
                        <Skeleton className="h-3 w-52 rounded" />
                      </span>
                    </span>
                    <Skeleton className="h-7 w-16 rounded" />
                  </li>
                ))}
              </ul>
            ) : suggestions.isError || (suggestions.data?.length ?? 0) === 0 ? (
              <p className="rounded border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
                Suggestions appear after the next check of your keywords: the sites that show up most in your top 10s.
              </p>
            ) : (
              <SuggestionList
                suggestions={suggestions.data ?? []}
                keywordsTotal={keywordsTotal}
                renderAction={(s) => {
                  const busy = add.isPending && add.variables?.domain === s.domain;
                  return (
                    <Button variant="outline" size="sm" className="h-7" disabled={add.isPending} onClick={() => addSuggestion(s.domain)} aria-label={`Add ${s.domain}`}>
                      {busy ? <Loader2 className="animate-spin" /> : <Plus />}
                      Add
                    </Button>
                  );
                }}
              />
            )}
          </div>
        </>
      ) : (
        <p className="mt-6 rounded border border-dashed px-3 py-2 text-sm text-muted-foreground">No competitors are tracked for this site yet. Ask your account manager to add some.</p>
      )}
    </StateCard>
  );
}
