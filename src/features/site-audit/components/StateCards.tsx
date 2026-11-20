import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { AlertCircle, FileWarning, Gauge, Globe, Link2Off, Loader2, Play, RefreshCw, ScanSearch, Search, Tags, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/utils/formatDate';
import type { Audit } from '../types';
import { AuditProgress } from './AuditProgress';

/** The frame every non-dashboard state sits in: an icon, a title, a line of text and whatever comes next. */
function StateCard({ icon: Icon, tone = 'primary', title, children }: { icon: LucideIcon; tone?: 'primary' | 'bad'; title: string; children: ReactNode }) {
  return (
    <section className="rounded border bg-card px-6 py-10 shadow-xs sm:px-10" aria-labelledby="audit-state-title">
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <span className={`flex size-12 items-center justify-center rounded-full ${tone === 'bad' ? 'bg-bad-soft text-bad' : 'bg-accent text-primary'}`}>
          <Icon className="size-5" aria-hidden />
        </span>
        <h2 id="audit-state-title" className="mt-3 text-lg font-semibold">
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
}

const CHECKS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Link2Off, title: 'Broken links and redirects', text: 'Links to missing pages, server errors and redirect chains that slow visitors and Google down.' },
  { icon: Tags, title: 'Titles and descriptions', text: 'Missing, duplicate, too long or too short page titles and meta descriptions.' },
  { icon: Search, title: 'Indexing', text: 'Pages accidentally hidden from Google (noindex), canonical mix-ups and orphan pages nothing links to.' },
  { icon: FileWarning, title: 'Content and images', text: 'Missing headings, thin pages and images without alt text.' },
  { icon: Gauge, title: 'Core Web Vitals', text: "Speed and stability of your key pages, from Google's PageSpeed Insights." },
];

export function NoSitesState() {
  return (
    <StateCard icon={Globe} title="No sites to audit yet">
      <p className="mt-1 max-w-md text-sm text-muted-foreground">Add your clients' websites first; each site can then be crawled and checked for SEO problems.</p>
      <Button asChild variant="outline" className="mt-5">
        <Link to="/dashboard/clients/sites">Go to Sites</Link>
      </Button>
    </StateCard>
  );
}

export function SiteNotFoundState() {
  return (
    <StateCard icon={AlertCircle} tone="bad" title="Site not found">
      <p className="mt-1 max-w-md text-sm text-muted-foreground">This site doesn't exist or you don't have access to it.</p>
      <Button asChild variant="outline" className="mt-5">
        <Link to="/dashboard/site-audit">Back to Site audit</Link>
      </Button>
    </StateCard>
  );
}

interface RunProps {
  canRun: boolean;
  starting: boolean;
  onRun: () => void;
}

/** A site with no audits yet: what the audit checks, and the button to start it. */
export function NeverAuditedState({ canRun, starting, onRun }: RunProps) {
  return (
    <StateCard icon={ScanSearch} title="Run your first audit">
      <p className="mt-1 max-w-lg text-sm text-muted-foreground">
        We crawl the site like Google does and list every problem we find, ranked by how much it matters, each with a plain-English fix.
      </p>
      <ul className="mt-6 grid w-full gap-3 text-left sm:grid-cols-2">
        {CHECKS.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex gap-3 rounded border bg-background/60 p-3">
            <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <span>
              <span className="block text-sm font-semibold">{title}</span>
              <span className="block text-xs text-muted-foreground">{text}</span>
            </span>
          </li>
        ))}
      </ul>
      {canRun ? (
        <Button className="mt-6" onClick={onRun} disabled={starting}>
          {starting ? <Loader2 className="animate-spin" /> : <Play />}
          Run first audit
        </Button>
      ) : (
        <p className="mt-6 rounded border border-dashed px-3 py-2 text-sm text-muted-foreground">This site hasn't been audited yet. Ask your account manager to run an audit.</p>
      )}
    </StateCard>
  );
}

export function FirstAuditRunningState({ audit }: { audit: Audit }) {
  return (
    <StateCard icon={ScanSearch} title="Auditing the site…">
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        We're crawling up to {audit.pageLimit.toLocaleString('en-GB')} pages and checking each one. This page updates by itself when the audit is done.
      </p>
      <AuditProgress audit={audit} className="mt-5 max-w-sm" />
    </StateCard>
  );
}

/** The latest audit failed and there is no earlier one to show. */
export function AuditFailedState({ audit, canRun, starting, onRun }: RunProps & { audit: Audit }) {
  const cancelled = audit.status === 'cancelled';
  return (
    <StateCard icon={AlertCircle} tone="bad" title={cancelled ? 'The audit was cancelled' : "The audit didn't finish"}>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        {cancelled ? 'It was stopped before it finished, so there are no results yet.' : (audit.error ?? 'The crawl stopped before it could finish.')}
        {audit.finishedAt && ` ${cancelled ? 'Stopped' : 'Failed'} ${formatDateTime(audit.finishedAt)}.`}
      </p>
      {canRun && (
        <Button className="mt-5" onClick={onRun} disabled={starting}>
          {starting ? <Loader2 className="animate-spin" /> : <RefreshCw />}
          {cancelled ? 'Run audit' : 'Try again'}
        </Button>
      )}
    </StateCard>
  );
}
