import { Award, Crosshair, PieChart, Sigma } from 'lucide-react';
import { StatTile, type StatTone } from '@/components/page/StatTile';
import { formatAvgRank, formatShare } from '../../lib/labels';
import type { Scan } from '../../types';

/** "was 5.2" against the previous finished scan, when there is one. */
const was = (value: number | null | undefined, format: (n: number | null) => string) => (value === null || value === undefined ? '' : ` · was ${format(value)}`);

const rankTone = (arp: number | null): StatTone => (arp === null ? 'bad' : arp <= 3 ? 'ok' : arp <= 10 ? 'warn' : 'bad');
const shareTone = (pct: number | null): StatTone => (pct === null ? 'neutral' : pct >= 50 ? 'ok' : pct >= 20 ? 'warn' : 'bad');

/** A finished scan's four figures; each hint compares with the scan before it. */
export function GridKpis({ scan, previous }: { scan: Scan; previous?: Scan }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatTile label="Average rank (ARP)" value={formatAvgRank(scan.arp)} hint={`Where found · lower is better${was(previous?.arp, formatAvgRank)}`} icon={Award} tone={rankTone(scan.arp)} />
      <StatTile label="Share of local voice" value={formatShare(scan.solv)} hint={`Points in the top 3${was(previous?.solv, formatShare)}`} icon={PieChart} tone={shareTone(scan.solv)} />
      <StatTile
        label="Found in"
        value={formatShare(scan.foundPct)}
        hint={`${scan.pointsFound} of ${scan.pointsTotal} points${was(previous?.foundPct, formatShare)}`}
        icon={Crosshair}
        tone={shareTone(scan.foundPct)}
      />
      <StatTile label="Average total rank" value={formatAvgRank(scan.atrp)} hint={`Not found counts as 21${was(previous?.atrp, formatAvgRank)}`} icon={Sigma} />
    </div>
  );
}
