import { CheckCircle2, ScanSearch, Sparkles, Wrench } from 'lucide-react';
import { ChangeBadge } from '@/features/search-console/components/ChangeBadge';
import { formatNumber } from '@/features/search-console/lib/format';
import { HealthGauge } from '@/features/site-audit/components/ScoreGauge';
import { SeverityBadge } from '@/features/site-audit/components/SeverityBadge';
import { SEVERITIES, SEVERITY } from '@/features/site-audit/lib/severity';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/formatDate';
import type { SiteAuditSnapshot } from '../../types';
import { EmptyLine, ReportCard, ReportSectionShell } from './ReportBlocks';

/** The site's technical health: the score with its change, issues by severity, fixed and new, and the top issues with how to fix them. */
export function SiteAuditSection({ data }: { data: SiteAuditSnapshot }) {
  const score = data.healthScore;
  const unavailable = !data.available || score === null || score === undefined ? (data.reason ?? 'No site audit has finished for this site yet.') : null;
  const counts = data.counts ?? { critical: 0, warning: 0, notice: 0 };
  const issues = data.topIssues ?? [];

  return (
    <ReportSectionShell
      icon={ScanSearch}
      title="Site audit"
      subtitle={data.auditedOn ? `Technical health, audited ${formatDate(data.auditedOn)}` : 'The site’s technical health'}
      unavailable={unavailable}
    >
      {score !== null && score !== undefined && (
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-[auto_minmax(0,1fr)]">
            <div className="flex flex-col items-center justify-center gap-2 rounded border bg-card px-6 py-4 shadow-xs print:break-inside-avoid">
              <HealthGauge score={score} />
              {data.healthChange !== null && data.healthChange !== undefined && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ChangeBadge value={data.healthChange} format={(n) => `${Math.round(n)} pts`} label="Health score" context="since the previous audit" />
                  since the previous audit
                </span>
              )}
            </div>
            <div className="grid content-start gap-3">
              <ul className="grid grid-cols-3 gap-3" aria-label="Issues by severity">
                {SEVERITIES.map((s) => {
                  const v = SEVERITY[s];
                  return (
                    <li key={s} className="min-w-0 rounded border bg-card px-3 py-2.5 shadow-xs">
                      <SeverityBadge severity={s} />
                      <p className={cn('mt-1.5 text-xl font-bold leading-tight tabular-nums', counts[s] > 0 && s !== 'notice' ? v.text : 'text-foreground')}>{formatNumber(counts[s])}</p>
                      <p className="truncate text-xs text-muted-foreground">{v.plural.toLowerCase()}</p>
                    </li>
                  );
                })}
              </ul>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 rounded border bg-card px-3 py-2.5 shadow-xs">
                  <CheckCircle2 className="size-5 shrink-0 text-ok" aria-hidden />
                  <span>
                    <span className="block text-lg font-bold leading-tight tabular-nums">{formatNumber(data.fixed ?? 0)}</span>
                    <span className="block text-xs text-muted-foreground">issues fixed</span>
                  </span>
                </div>
                <div className="flex items-center gap-3 rounded border bg-card px-3 py-2.5 shadow-xs">
                  <Sparkles className="size-5 shrink-0 text-warn" aria-hidden />
                  <span>
                    <span className="block text-lg font-bold leading-tight tabular-nums">{formatNumber(data.new ?? 0)}</span>
                    <span className="block text-xs text-muted-foreground">new issues</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <ReportCard title="What to fix next" aside="Most important first">
            {issues.length === 0 ? (
              <EmptyLine>No issues to fix. Nicely done.</EmptyLine>
            ) : (
              <ol className="divide-y">
                {issues.map((issue) => (
                  <li key={issue.title} className="space-y-1.5 px-4 py-3 print:break-inside-avoid">
                    <div className="flex flex-wrap items-center gap-2">
                      <SeverityBadge severity={issue.severity} />
                      <span className="min-w-0 flex-1 text-sm font-semibold">{issue.title}</span>
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {formatNumber(issue.count)} {issue.count === 1 ? 'page' : 'pages'}
                      </span>
                    </div>
                    {issue.howToFix && (
                      <p className="flex gap-2 text-sm text-muted-foreground">
                        <Wrench className="mt-0.5 size-3.5 shrink-0 text-(--brand-accent)" aria-hidden />
                        <span>
                          <span className="font-medium text-foreground">How to fix: </span>
                          {issue.howToFix}
                        </span>
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </ReportCard>
        </div>
      )}
    </ReportSectionShell>
  );
}
