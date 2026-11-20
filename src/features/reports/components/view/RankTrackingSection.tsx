import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react';
import { ChangeBadge } from '@/features/search-console/components/ChangeBadge';
import { formatDecimal, formatNumber, formatPosition } from '@/features/search-console/lib/format';
import { DistributionBar } from '@/features/rank-tracking/components/summary/DistributionBar';
import { PositionChange, Rank } from '@/features/rank-tracking/components/cells';
import { DEVICE_LABEL, inTop10 } from '@/features/rank-tracking/lib/position';
import { SERP_FEATURES } from '@/features/rank-tracking/lib/serpFeatures';
import { cn } from '@/lib/utils';
import type { KeywordGroup, RankMove, RankTrackingSnapshot } from '../../types';
import { EmptyLine, ReportCard, ReportSectionShell, ReportTile } from './ReportBlocks';

const SINCE = 'since the start of the period';

function KeywordChips({ group, empty, tone }: { group: KeywordGroup | undefined; empty: string; tone: 'good' | 'bad' }) {
  if (!group || group.count === 0) return <EmptyLine>{empty}</EmptyLine>;
  const more = group.count - group.keywords.length;
  return (
    <ul className="flex flex-wrap gap-1.5 p-4">
      {group.keywords.map((k) => (
        <li key={k} className={cn('rounded border px-2 py-0.5 text-xs font-medium', tone === 'good' ? 'border-ok/25 bg-ok-soft text-ok' : 'border-bad/25 bg-bad-soft text-bad')}>
          {k}
        </li>
      ))}
      {more > 0 && <li className="px-1 py-0.5 text-xs text-muted-foreground">and {formatNumber(more)} more</li>}
    </ul>
  );
}

function Moves({ kind, moves }: { kind: 'gains' | 'drops'; moves: RankMove[] }) {
  const gains = kind === 'gains';
  const Icon = gains ? TrendingUp : TrendingDown;
  return (
    <ReportCard
      title={gains ? 'Biggest gains' : 'Biggest drops'}
      aside={
        <span className={cn('inline-grid size-5 place-items-center rounded', gains ? 'bg-ok-soft text-ok' : 'bg-bad-soft text-bad')} aria-hidden>
          <Icon className="size-3" />
        </span>
      }
    >
      {moves.length === 0 ? (
        <EmptyLine>{gains ? 'No keyword moved up this period.' : 'No keyword dropped this period.'}</EmptyLine>
      ) : (
        <ul className="divide-y">
          {moves.map((m) => (
            <li key={`${m.keyword}-${m.locationName ?? ''}-${m.device ?? ''}`} className="flex items-center gap-3 px-4 py-2">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{m.keyword}</span>
                {(m.locationName || m.device) && <span className="block truncate text-xs text-muted-foreground">{[m.locationName, m.device && DEVICE_LABEL[m.device]].filter(Boolean).join(' · ')}</span>}
              </span>
              <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground" aria-label={`From ${m.from ?? 'not ranking'} to ${m.to ?? 'not ranking'}`}>
                <Rank position={m.from} className="font-normal" />
                <ArrowRight className="size-3" aria-hidden />
                <Rank position={m.to} className="text-foreground" />
              </span>
              <PositionChange value={m.change} context="this period" className="w-12 justify-center" />
            </li>
          ))}
        </ul>
      )}
    </ReportCard>
  );
}

/** Featured snippet, map pack and AI overview: how many tracked searches show one, and in how many the site appears. */
function SerpFeatures({ features }: { features: NonNullable<RankTrackingSnapshot['serpFeatures']> }) {
  return (
    <ReportCard title="Google features" aside="Searches showing each, and where the site appears">
      <ul className="grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {SERP_FEATURES.map(({ key, label, icon: Icon }) => {
          const { present, ours } = features[key] ?? { present: 0, ours: 0 };
          return (
            <li key={key} className="flex items-start gap-2.5 px-4 py-3">
              <Icon className="mt-0.5 size-4 shrink-0 text-(--brand-accent)" aria-hidden />
              <span className="text-sm">
                <span className="block font-medium">{label}</span>
                <span className="block text-xs text-muted-foreground">
                  {present ? `Shown for ${formatNumber(present)} · the site appears in ${formatNumber(ours)}` : 'Not shown for any tracked search'}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </ReportCard>
  );
}

/** Rankings over the period: the figures, the spread over Google's pages, keywords that entered the top 10 / top 3, and the biggest moves. */
export function RankTrackingSection({ data }: { data: RankTrackingSnapshot }) {
  const unavailable = !data.available || !data.distribution ? (data.reason ?? 'Rank tracking figures are not available for this period.') : null;
  const d = data.distribution;
  const start = data.distributionStart ?? null;
  const count = (n: number) => formatNumber(n);

  return (
    <ReportSectionShell icon={TrendingUp} title="Rank tracking" subtitle="Where the site ranks in Google for the searches that matter" unavailable={unavailable}>
      {d && (
        <div className="space-y-3">
          <div role="group" aria-label="Ranking figures" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <ReportTile label="Keywords tracked" value={formatNumber(data.keywordsTracked ?? 0)} foot={<span>Keyword × location × device</span>} />
            <ReportTile
              label="Average position"
              value={formatPosition(data.avgPosition)}
              foot={
                data.avgPositionChange === null || data.avgPositionChange === undefined ? (
                  <span>Lower is better</span>
                ) : (
                  <>
                    <ChangeBadge value={data.avgPositionChange} better="higher" format={formatDecimal} label="Average position" context={SINCE} />
                    <span>{SINCE}</span>
                  </>
                )
              }
            />
            <ReportTile
              label="In the top 10"
              value={formatNumber(inTop10(d))}
              foot={
                start ? (
                  <>
                    <ChangeBadge value={inTop10(d) - inTop10(start)} format={count} label="Top 10" context={SINCE} />
                    <span>{SINCE}</span>
                  </>
                ) : (
                  <span>On Google's first page</span>
                )
              }
            />
            <ReportTile
              label="In the top 3"
              value={formatNumber(d.top3)}
              foot={
                start ? (
                  <>
                    <ChangeBadge value={d.top3 - start.top3} format={count} label="Top 3" context={SINCE} />
                    <span>{SINCE}</span>
                  </>
                ) : (
                  <span>The first three results</span>
                )
              }
            />
          </div>

          <DistributionBar distribution={d} before={start} context={SINCE} color="var(--brand-accent)" title="Where the keywords rank" />

          <div className="grid gap-3 lg:grid-cols-2">
            <ReportCard title="Entered the top 10" aside={formatNumber(data.enteredTop10?.count ?? 0)}>
              <KeywordChips group={data.enteredTop10} empty="No keyword entered the top 10 this period." tone="good" />
            </ReportCard>
            <ReportCard title="Entered the top 3" aside={formatNumber(data.enteredTop3?.count ?? 0)}>
              <KeywordChips group={data.enteredTop3} empty="No keyword entered the top 3 this period." tone="good" />
            </ReportCard>
          </div>
          {(data.leftTop10?.count ?? 0) > 0 && (
            <ReportCard title="Left the top 10" aside={formatNumber(data.leftTop10?.count ?? 0)}>
              <KeywordChips group={data.leftTop10} empty="" tone="bad" />
            </ReportCard>
          )}

          <div className="grid gap-3 lg:grid-cols-2">
            <Moves kind="gains" moves={data.gains ?? []} />
            <Moves kind="drops" moves={data.drops ?? []} />
          </div>

          {data.serpFeatures && <SerpFeatures features={data.serpFeatures} />}
        </div>
      )}
    </ReportSectionShell>
  );
}
