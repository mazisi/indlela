import { MapPin, XCircle } from 'lucide-react';
import type { DataColumn } from '@/components/table/DataTable';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/formatDate';
import type { KeywordSortKey, RankKeyword } from '../../types';
import { DeviceIcon, PositionChange, PositionSparkline, Rank, SerpFeatureIcons, Tags } from '../cells';
import { KeyStar, Muted, PositionCell, UrlCell } from './KeywordCells';

/** The star toggle: managers only (undefined shows a plain star on key keywords). */
export interface KeyToggle {
  busyId: number | undefined;
  onToggle: (k: RankKeyword) => void;
}

/** The Keywords tab's columns; the keyword is a button too, so keyboard users can open its history. */
export const keywordColumns = (onOpen: (k: RankKeyword) => void, keyToggle?: KeyToggle): DataColumn<RankKeyword, KeywordSortKey>[] => [
  {
    label: 'Keyword',
    sortKey: 'keyword',
    skeleton: 'w-40',
    cell: (k) => (
      <span className="block min-w-0 max-w-64">
        <span className="flex items-center gap-1.5">
          <KeyStar k={k} busy={keyToggle?.busyId === k.id} onToggle={keyToggle?.onToggle} />
          <button type="button" onClick={() => onOpen(k)} className="truncate text-left text-sm font-medium text-foreground hover:text-primary hover:underline">
            {k.keyword}
          </button>
          {!k.isActive && <span className="shrink-0 rounded bg-muted px-1.5 py-px text-2xs font-semibold text-muted-foreground">Paused</span>}
        </span>
        <Tags tags={k.tags} />
      </span>
    ),
  },
  {
    label: 'Location',
    skeleton: 'w-24',
    cell: (k) => (
      <span className="flex max-w-40 items-center gap-1 text-sm" title={k.location.type === 'coordinate' ? `${k.location.name} (${k.location.coordinate})` : k.location.name}>
        {k.location.type === 'coordinate' && <MapPin className="size-3 shrink-0 text-muted-foreground" aria-label="By coordinates" />}
        <span className="truncate">{k.location.name}</span>
      </span>
    ),
  },
  { label: 'Device', skeleton: 'w-4', cell: (k) => <DeviceIcon device={k.device} /> },
  { label: 'Position', sortKey: 'position', align: 'right', skeleton: 'w-6', cell: (k) => <PositionCell k={k} /> },
  { label: '1d', align: 'right', skeleton: 'w-8', cell: (k) => <PositionChange value={k.change1d} context="since the previous check" /> },
  { label: '7d', sortKey: 'change_7d', align: 'right', skeleton: 'w-8', cell: (k) => <PositionChange value={k.change7d} context="over 7 days" /> },
  { label: '30d', sortKey: 'change_30d', align: 'right', skeleton: 'w-8', cell: (k) => <PositionChange value={k.change30d} context="over 30 days" /> },
  { label: 'Best', sortKey: 'best_position', align: 'right', skeleton: 'w-6', cell: (k) => <Rank position={k.bestPosition} className="font-normal" /> },
  { label: 'Ranking URL', skeleton: 'w-32', wideOnCard: true, cell: (k) => <UrlCell k={k} /> },
  { label: 'SERP', skeleton: 'w-12', cell: (k) => <SerpFeatureIcons features={k.serpFeatures} /> },
  { label: 'Trend', skeleton: 'w-20', cell: (k) => <PositionSparkline points={k.history} /> },
  {
    label: 'Last checked',
    skeleton: 'w-16',
    cell: (k) =>
      k.lastCheckStatus === 'failed' ? (
        <span className={cn('inline-flex items-center gap-1 rounded bg-bad-soft px-1.5 py-0.5 text-2xs font-semibold text-bad')} title={k.lastCheckedOn ? `Last good check ${formatDate(k.lastCheckedOn)}` : undefined}>
          <XCircle className="size-3" aria-hidden />
          Check failed
        </span>
      ) : k.lastCheckedOn ? (
        <span className="text-sm tabular-nums">{formatDate(k.lastCheckedOn)}</span>
      ) : (
        <Muted>Pending</Muted>
      ),
  },
];
