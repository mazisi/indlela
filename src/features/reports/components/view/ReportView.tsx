import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/utils/formatDate';
import { brandStyle, brandTheme } from '../../lib/brand';
import type { ReportBranding, ReportSnapshot } from '../../types';
import { AtAGlance } from './AtAGlance';
import { RankTrackingSection } from './RankTrackingSection';
import { ReportHeader } from './ReportHeader';
import { SearchConsoleSection } from './SearchConsoleSection';
import { SiteAuditSection } from './SiteAuditSection';

/** What a report needs to render, whether from the app (GET /reports/{id}) or a share link. */
export interface ReportViewModel {
  title: string;
  periodLabel: string;
  summary: string[];
  note: string | null;
  data: ReportSnapshot;
  branding: ReportBranding;
  generatedAt: string | null;
}

/**
 * A white-label report, the same in the app's preview and on the public
 * share page: the agency's branded header, the plain-language summary and
 * note, then each section the report includes (a short note in place of one
 * without figures). Nothing in it names Indlela.
 */
export function ReportView({ report, headerAction }: { report: ReportViewModel; headerAction?: ReactNode }) {
  const { data, branding } = report;
  const compareLabel = data.comparePeriod?.label ?? null;

  return (
    <article className="bg-muted/40 print:bg-white" style={brandStyle(branding.brandColor)} data-testid="report-view" data-brand={brandTheme(branding.brandColor).brand} data-ink={brandTheme(branding.brandColor).ink}>
      <ReportHeader title={report.title} periodLabel={report.periodLabel} branding={branding} data={data} action={headerAction} />
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-6 sm:px-6 sm:py-8">
        <AtAGlance summary={report.summary} note={report.note} agency={branding.name} />
        {data.searchConsole && <SearchConsoleSection data={data.searchConsole} compareLabel={compareLabel} />}
        {data.rankTracking && <RankTrackingSection data={data.rankTracking} />}
        {data.siteAudit && <SiteAuditSection data={data.siteAudit} />}
        <footer className="border-t pt-4 text-xs text-muted-foreground">
          Prepared by <span className="font-medium text-foreground">{branding.name}</span>
          {data.client?.name ? ` for ${data.client.name}` : ''}
          {report.generatedAt ? ` · ${formatDate(report.generatedAt)}` : ''}
          {compareLabel ? ` · Changes are compared with ${compareLabel}.` : ''}
        </footer>
      </div>
    </article>
  );
}

/** Loading: the header band, the summary card and a section's tiles, in place. */
export function ReportViewSkeleton({ label = 'Loading the report' }: { label?: string }) {
  return (
    <div aria-busy="true" aria-label={label} className="bg-muted/40">
      <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6 sm:pt-8">
        <div className="space-y-5 rounded bg-muted px-5 py-6 sm:px-8">
          <div className="flex items-center gap-3">
            <Skeleton className="size-12 rounded bg-background/70" />
            <Skeleton className="h-3.5 w-32 rounded bg-background/70" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-24 rounded bg-background/70" />
            <Skeleton className="h-6 w-72 max-w-full rounded bg-background/70" />
            <Skeleton className="h-3.5 w-48 rounded bg-background/70" />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-6 sm:px-6 sm:py-8">
        <div className="space-y-3 rounded border bg-card p-5">
          <Skeleton className="h-3 w-24 rounded" />
          {['w-72', 'w-64', 'w-56'].map((w) => (
            <Skeleton key={w} className={`h-4 max-w-full rounded ${w}`} />
          ))}
        </div>
        <div className="space-y-3">
          <Skeleton className="h-6 w-48 rounded" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {['w-16', 'w-20', 'w-12', 'w-10'].map((w) => (
              <div key={w} className="space-y-2 rounded border bg-card px-4 py-3">
                <Skeleton className="h-3 w-20 rounded" />
                <Skeleton className={`h-6 rounded ${w}`} />
                <Skeleton className="h-4 w-24 rounded" />
              </div>
            ))}
          </div>
          <div className="h-64 rounded border bg-card" />
        </div>
      </div>
    </div>
  );
}
