import type { ReactNode } from 'react';
import { useParams } from 'react-router';
import { Download, FileX2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { publicPdfUrl } from '../api/publicReportsApi';
import { usePublicDocument } from '../hooks/usePublicDocument';
import { usePublicReport } from '../hooks/usePublicReport';
import { ReportView, ReportViewSkeleton } from '../components/view/ReportView';

const isNotFound = (error: unknown) => (error as { response?: { status?: number } } | null)?.response?.status === 404;

/** A plain, unbranded page for when the report can't be shown (no app name, no agency we can't confirm). */
function Neutral({ icon: Icon, title, children }: { icon: typeof FileX2; title: string; children: ReactNode }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-muted/40 px-4 py-12">
      <section className="w-full max-w-md rounded border bg-card px-6 py-10 text-center shadow-sm" aria-labelledby="public-report-state">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
          <Icon className="size-5" aria-hidden />
        </span>
        <h1 id="public-report-state" className="mt-3 text-lg font-semibold">
          {title}
        </h1>
        {children}
      </section>
    </main>
  );
}

/**
 * The client-facing report behind a share link (`/r/:token`): outside the
 * app's layout and sign-in, branded only with the agency's logo, name and
 * colour. An unknown, revoked or expired link gets a neutral message.
 */
export default function PublicReportPage() {
  const { token = '' } = useParams();
  const query = usePublicReport(token);
  const report = query.data;
  usePublicDocument(report ? `${report.title} · ${report.branding.name}` : query.isError ? 'Report unavailable' : 'Report', report?.branding.logoUrl);

  if (query.isPending) return <ReportViewSkeleton />;

  if (query.isError || !report) {
    return isNotFound(query.error) || !query.isError ? (
      <Neutral icon={FileX2} title="This report link is no longer available">
        <p className="mt-1 text-sm text-muted-foreground">Ask your agency for a new one.</p>
      </Neutral>
    ) : (
      <Neutral icon={RefreshCw} title="We couldn't load this report">
        <p className="mt-1 text-sm text-muted-foreground">Check your connection and try again.</p>
        <Button variant="outline" className="mt-5" onClick={() => query.refetch()}>
          Try again
        </Button>
      </Neutral>
    );
  }

  return (
    <main className="min-h-dvh bg-muted/40 print:bg-white">
      <ReportView
        report={{ ...report, periodLabel: report.periodLabel ?? report.data.period?.label ?? '' }}
        headerAction={
          <a
            href={publicPdfUrl(token)}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded border border-current/30 bg-white/10 px-3 text-sm font-medium transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current print:hidden"
          >
            <Download className="size-4" aria-hidden />
            Download PDF
          </a>
        }
      />
    </main>
  );
}
