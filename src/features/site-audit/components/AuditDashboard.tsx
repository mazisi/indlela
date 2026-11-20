import { Archive } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatNumber } from '@/features/search-console/lib/format';
import { AUDIT_TABS, type AuditTab } from '../hooks/useAuditParams';
import type { Audit } from '../types';
import { AuditSummary } from './AuditSummary';
import { HistoryTab } from './history/HistoryTab';
import { IssuesTab } from './issues/IssuesTab';
import { PagesTab } from './pages/PagesTab';
import { VitalsTab } from './vitals/VitalsTab';

interface Props {
  audit: Audit;
  recent: Audit[] | undefined;
  tab: AuditTab;
  onTabChange: (tab: AuditTab) => void;
  onSelectAudit: (audit: Audit) => void;
}

/** Older audits keep their summary only; their URL-level results are pruned. */
function PrunedNotice({ what }: { what: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded border border-dashed bg-card px-6 py-12 text-center">
      <Archive className="size-6 text-muted-foreground" aria-hidden />
      <p className="text-sm font-medium">The {what} of this audit is no longer kept</p>
      <p className="max-w-md text-sm text-muted-foreground">We keep full details for a site's most recent audits; older ones keep their scores and counts, shown above.</p>
    </div>
  );
}

/** A finished audit: the summary and the Issues / Pages / Core Web Vitals / History tabs. */
export function AuditDashboard({ audit, recent, tab, onTabChange, onSelectAudit }: Props) {
  const previousId = audit.comparison?.previousAuditId;
  const previous = previousId ? recent?.find((a) => a.id === previousId) : undefined;

  return (
    <div className="space-y-4">
      <AuditSummary audit={audit} previousDate={previous?.finishedAt} onShowIssues={() => onTabChange('issues')} />
      <Tabs value={tab} onValueChange={(v) => onTabChange(v as AuditTab)} className="gap-3">
        <div className="overflow-x-auto border-b">
          <TabsList aria-label="Audit">
            {AUDIT_TABS.map((t) => (
              <TabsTrigger key={t.key} value={t.key}>
                {t.label}
                {t.key === 'issues' && <span className="rounded bg-muted px-1.5 text-2xs font-semibold tabular-nums text-muted-foreground">{formatNumber(audit.counts.total)}</span>}
                {t.key === 'pages' && <span className="rounded bg-muted px-1.5 text-2xs font-semibold tabular-nums text-muted-foreground">{formatNumber(audit.pagesCrawled)}</span>}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {AUDIT_TABS.map((t) => (
          <TabsContent key={t.key} value={t.key}>
            {t.key === tab && t.key === 'issues' && (audit.detailsPruned ? <PrunedNotice what="issue list" /> : <IssuesTab key={audit.id} auditId={audit.id} />)}
            {t.key === tab && t.key === 'pages' && (audit.detailsPruned ? <PrunedNotice what="crawled pages" /> : <PagesTab key={audit.id} auditId={audit.id} />)}
            {t.key === tab && t.key === 'vitals' && <VitalsTab key={audit.id} audit={audit} />}
            {t.key === tab && t.key === 'history' && <HistoryTab siteId={audit.siteId} currentId={audit.id} recent={recent} onSelect={onSelectAudit} />}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
