import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Head } from '@/components/ui/Head';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/page/PageHeader';
import { usePermissions } from '@/contexts/PermissionContextType';
import { FormAlert } from '@/features/auth/components/FormAlert';
import { formatNumber } from '@/features/search-console/lib/format';
import { getApiErrorMessage } from '@/utils/formErrorHandler';
import { RANK_TABS, useRankParams, type RankTab } from '../hooks/useRankParams';
import { useKeywords, useRankSites, useRankSummary, useRankUsage } from '../hooks/useRankTracking';
import { DEFAULT_PER_PAGE } from '@/types/pagination';
import type { RankSummary } from '../types';
import { AddKeywordsSheet } from '../components/add/AddKeywordsSheet';
import { CannibalisationTab } from '../components/cannibalisation/CannibalisationTab';
import { KeywordDetailSheet, type KeywordRef } from '../components/keywords/KeywordDetailSheet';
import { KeywordsTab } from '../components/keywords/KeywordsTab';
import { AllPausedNotice, NoChecksYetNotice, NoKeywordsState, SiteNotFoundState } from '../components/StateCards';
import { ChecksPausedNotice, UsageStripCompact } from '../components/overview/UsageStrip';
import { RankSummaryPanel, RankSummarySkeleton } from '../components/summary/RankSummaryPanel';

const UPDATE_PERMISSION = 'update_rank_tracking';

const TabCount = ({ n, tone }: { n: number; tone?: 'warn' }) => (
  <span className={tone === 'warn' && n > 0 ? 'rounded bg-warn-soft px-1.5 text-2xs font-semibold tabular-nums text-warn' : 'rounded bg-muted px-1.5 text-2xs font-semibold tabular-nums text-muted-foreground'}>
    {formatNumber(n)}
  </span>
);

/**
 * One site's rankings: the summary (tiles, trend, distribution, the week's
 * movers, SERP features, cannibalisation), then the Keywords and
 * Cannibalisation tabs (tab, filters and sort in the URL). A keyword opens
 * its 90-day history in a drawer; managers add, edit, check and delete.
 */
export default function RankTrackingSitePage() {
  const siteId = Number(useParams().siteId);
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(UPDATE_PERMISSION);
  const { tab, setTab } = useRankParams();
  const [adding, setAdding] = useState(false);
  const [detail, setDetail] = useState<KeywordRef>();

  const sites = useRankSites();
  const usage = useRankUsage();
  const site = sites.data?.find((s) => s.id === siteId);
  const summary = useRankSummary(siteId, Boolean(site));
  // The summary counts active keywords only: when it has none, the list says whether all are paused.
  const noActive = summary.data?.keywordsCount === 0;
  const all = useKeywords(siteId, { page: 1, perPage: DEFAULT_PER_PAGE }, noActive);
  const hasKeywords = Boolean(summary.data && (summary.data.keywordsCount > 0 || (all.data?.meta.total ?? 0) > 0));

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <Head title={site ? `${site.name} · Rank tracking` : 'Rank tracking'} />
      <Link to="/dashboard/rank-tracking" className="-mb-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary">
        <ArrowLeft className="size-3.5" aria-hidden />
        All sites
      </Link>
      <PageHeader
        eyebrow={site?.client ? `Rank tracking · ${site.client.name}` : 'Rank tracking'}
        title={site?.name ?? (sites.isPending ? 'Loading…' : 'Rank tracking')}
        description={
          site && (
            <a href={site.url} target="_blank" rel="noreferrer noopener" className="hover:text-primary hover:underline">
              {site.url}
            </a>
          )
        }
        actions={
          site && (
            <div className="flex flex-wrap items-center gap-2">
              {usage.data && <UsageStripCompact usage={usage.data} />}
              {canManage && hasKeywords && (
                <Button onClick={() => setAdding(true)}>
                  <Plus />
                  Add keywords
                </Button>
              )}
            </div>
          )
        }
      />

      {usage.data?.paused && site && <ChecksPausedNotice />}

      {sites.isPending ? (
        <RankSummarySkeleton />
      ) : sites.isError ? (
        <LoadError error={sites.error} what="this site" onRetry={() => sites.refetch()} />
      ) : !site ? (
        <SiteNotFoundState />
      ) : summary.isPending || (noActive && all.isPending) ? (
        <RankSummarySkeleton />
      ) : summary.isError ? (
        <LoadError error={summary.error} what="the rankings" onRetry={() => summary.refetch()} />
      ) : !hasKeywords ? (
        <NoKeywordsState canAdd={canManage} onAdd={() => setAdding(true)} />
      ) : (
        <SiteRankings
          siteId={siteId}
          summary={summary.data}
          neverChecked={!site.lastCheckedOn}
          canManage={canManage}
          tab={tab}
          onTab={setTab}
          onOpen={setDetail}
        />
      )}

      {site && canManage && <AddKeywordsSheet siteId={site.id} siteName={site.name} open={adding} onOpenChange={setAdding} />}
      <KeywordDetailSheet keyword={detail} onClose={() => setDetail(undefined)} />
    </div>
  );
}

interface SiteRankingsProps {
  siteId: number;
  summary: RankSummary;
  neverChecked: boolean;
  canManage: boolean;
  tab: RankTab;
  onTab: (tab: RankTab) => void;
  onOpen: (keyword: KeywordRef) => void;
}

function SiteRankings({ siteId, summary, neverChecked, canManage, tab, onTab, onOpen }: SiteRankingsProps) {
  return (
    <div className="space-y-4">
      {summary.keywordsCount === 0 ? (
        <AllPausedNotice />
      ) : neverChecked ? (
        <NoChecksYetNotice canCheck={canManage} />
      ) : (
        <RankSummaryPanel
          summary={summary}
          onOpenMover={(m) => onOpen({ id: m.keywordId, keyword: m.keyword, locationName: m.locationName, device: m.device })}
          onOpenCannibalisation={() => onTab('cannibalisation')}
        />
      )}
      <Tabs value={tab} onValueChange={(v) => onTab(v as RankTab)} className="gap-3">
        <div className="overflow-x-auto border-b">
          <TabsList aria-label="Rankings">
            {RANK_TABS.map((t) => (
              <TabsTrigger key={t.key} value={t.key}>
                {t.label}
                {t.key === 'keywords' && <TabCount n={summary.keywordsCount} />}
                {t.key === 'cannibalisation' && <TabCount n={summary.cannibalisedCount} tone="warn" />}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {RANK_TABS.map((t) => (
          <TabsContent key={t.key} value={t.key}>
            {t.key === tab && t.key === 'keywords' && (
              <KeywordsTab
                siteId={siteId}
                canManage={canManage}
                locations={summary.locations}
                tags={summary.tags}
                onOpen={(k) => onOpen({ id: k.id, keyword: k.keyword, locationName: k.location.name, device: k.device })}
              />
            )}
            {t.key === tab && t.key === 'cannibalisation' && (
              <CannibalisationTab siteId={siteId} onOpen={(r) => onOpen({ id: r.keywordId, keyword: r.keyword, locationName: r.locationName, device: r.device })} />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function LoadError({ error, what, onRetry }: { error: unknown; what: string; onRetry: () => void }) {
  return (
    <FormAlert tone="error">
      <p>{getApiErrorMessage(error, `We could not load ${what}.`)}</p>
      <p>
        <button type="button" className="font-medium underline" onClick={onRetry}>
          Try again
        </button>
      </p>
    </FormAlert>
  );
}
