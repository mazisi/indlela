import { History } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDateTime } from '@/utils/formatDate';
import { formatAvgRank, SCAN_STATUS_LABEL, scanDate } from '../../lib/labels';
import type { Scan } from '../../types';

const describe = (s: Scan) => (s.status === 'done' ? `ARP ${formatAvgRank(s.arp)}` : SCAN_STATUS_LABEL[s.status]);

/** Which scan the page shows: the latest by default, then the history (newest first) with each one's date and ARP. */
export function ScanPicker({ scans, value, onChange }: { scans: Scan[]; value: number; onChange: (scanId: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <History className="size-4 text-muted-foreground" aria-hidden />
      <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
        <SelectTrigger className="h-8 w-64 bg-card text-sm" aria-label="Scan">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {scans.map((s, i) => (
            <SelectItem key={s.id} value={String(s.id)}>
              <span className="tabular-nums">{formatDateTime(scanDate(s))}</span>
              <span className="text-muted-foreground">
                · {describe(s)}
                {i === 0 && ' · latest'}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
