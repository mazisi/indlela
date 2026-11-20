import type { ReactNode } from 'react';
import { CheckCircle2, ExternalLink } from 'lucide-react';
import { SheetCloseFooter } from '@/components/form/SheetCloseFooter';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { FormAlert } from '@/features/auth/components/FormAlert';
import { PageLink } from '@/features/search-console/components/reports/cells';
import { formatNumber, pagePath } from '@/features/search-console/lib/format';
import { cn } from '@/lib/utils';
import { getApiErrorMessage } from '@/utils/formErrorHandler';
import { useCrawledPage } from '../../hooks/useSiteAudit';
import { SEVERITIES } from '../../lib/severity';
import type { CrawledPageDetail, RedirectHop } from '../../types';
import { IssueDetails, RedirectChain, StatusCode } from '../issues/IssueDetails';
import { NewBadge, SeverityBadge } from '../SeverityBadge';
import { IndexableBadge } from './IndexableBadge';

interface Props {
  auditId: number;
  pageId: number | undefined;
  onClose: () => void;
}

/** One crawled page: its SEO fields, the issues on it and the pages that link to it. */
export function PageDetailSheet({ auditId, pageId, onClose }: Props) {
  const page = useCrawledPage(auditId, pageId);
  const data = page.data;

  return (
    <Sheet open={pageId !== undefined} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-2xl">
        <SheetHeader className="border-b pr-10">
          <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Crawled page</p>
          <SheetTitle className="break-all font-mono text-base">{data ? pagePath(data.url) : 'Loading…'}</SheetTitle>
          <SheetDescription asChild>
            <div>
              {data ? (
                <a href={data.url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 break-all text-xs text-primary hover:underline">
                  {data.url}
                  <ExternalLink className="size-3 shrink-0" aria-hidden />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              ) : (
                <span className="text-xs">The page's SEO details, issues and inlinks.</span>
              )}
            </div>
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4">
          {page.isError ? (
            <FormAlert tone="error">
              <p>{getApiErrorMessage(page.error, 'We could not load this page.')}</p>
            </FormAlert>
          ) : !data ? (
            <DetailSkeleton />
          ) : (
            <PageDetail page={data} />
          )}
        </div>
        <SheetCloseFooter />
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={cn('min-w-0', wide && 'sm:col-span-2')}>
      <dt className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-words text-sm">{children}</dd>
    </div>
  );
}

/** The chain with the address it ends at, when the last recorded hop isn't it. */
function withFinal(chain: RedirectHop[], finalUrl: string | null, finalStatus: number | null | undefined): RedirectHop[] {
  if (!finalUrl || chain[chain.length - 1]?.url === finalUrl) return chain;
  return [...chain, { url: finalUrl, statusCode: finalStatus ?? null }];
}

const text = (v: string | null, empty = 'Missing') => (v ? v : <span className="italic text-muted-foreground">{empty}</span>);

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function PageDetail({ page }: { page: CrawledPageDetail }) {
  const issues = [...page.issues].sort((a, b) => SEVERITIES.indexOf(a.severity) - SEVERITIES.indexOf(b.severity));
  return (
    <div className="space-y-6">
      <Section title="Response">
        <dl className="grid gap-3 rounded border bg-card p-3 sm:grid-cols-4">
          <Field label="Status">
            <StatusCode code={page.statusCode} />
          </Field>
          <Field label="Response">{page.responseMs === null ? '—' : `${formatNumber(page.responseMs)} ms`}</Field>
          <Field label="Depth">{formatNumber(page.depth)} clicks</Field>
          <Field label="Type">{page.contentType ?? '—'}</Field>
          {page.redirectChain && page.redirectChain.length > 0 && (
            <Field label="Redirects" wide>
              <RedirectChain hops={withFinal(page.redirectChain, page.finalUrl, page.finalStatusCode)} />
            </Field>
          )}
          {page.fetchError && (
            <Field label="Error" wide>
              <span className="text-bad">{page.fetchError}</span>
            </Field>
          )}
        </dl>
      </Section>

      <Section title="SEO">
        <dl className="grid gap-3 rounded border bg-card p-3 sm:grid-cols-2">
          <Field label="Title" wide>
            {text(page.title)}
            {page.title && <span className="ml-1.5 text-xs text-muted-foreground">({page.title.length} characters)</span>}
          </Field>
          <Field label="Meta description" wide>
            {text(page.metaDescription)}
            {page.metaDescription && <span className="ml-1.5 text-xs text-muted-foreground">({page.metaDescription.length} characters)</span>}
          </Field>
          <Field label={page.h1Count > 1 ? `H1 (${page.h1Count} on the page)` : 'H1'} wide>
            {text(page.h1)}
          </Field>
          <Field label={page.canonicalCount && page.canonicalCount > 1 ? `Canonical (${page.canonicalCount} tags)` : 'Canonical'} wide>
            {page.canonical ? <PageLink url={page.canonical} className="max-w-full" /> : text(null, 'None')}
          </Field>
          <Field label="Indexable">
            <IndexableBadge indexable={page.isIndexable} />
          </Field>
          <Field label="In sitemap">{page.inSitemap ? 'Yes' : 'No'}</Field>
          <Field label="Meta robots">{page.metaRobots ?? '—'}</Field>
          <Field label="X-Robots-Tag">{page.xRobotsTag ?? '—'}</Field>
        </dl>
      </Section>

      <Section title="Content and links">
        <dl className="grid gap-3 rounded border bg-card p-3 grid-cols-2 sm:grid-cols-4">
          <Field label="Words">{formatNumber(page.wordCount)}</Field>
          <Field label="Images">
            {formatNumber(page.imagesCount)}
            {page.imagesMissingAlt > 0 && <span className="ml-1 text-xs text-warn">({formatNumber(page.imagesMissingAlt)} without alt)</span>}
          </Field>
          <Field label="Inlinks">{formatNumber(page.inlinksCount)}</Field>
          <Field label="Outlinks">{formatNumber(page.outlinksCount)}</Field>
          {page.missingAltImages && page.missingAltImages.length > 0 && (
            <div className="col-span-2 sm:col-span-4">
              <dt className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Images without alt text</dt>
              <dd className="mt-0.5 space-y-0.5">
                {page.missingAltImages.map((src) => (
                  <span key={src} className="block truncate font-mono text-xs" title={src}>
                    {pagePath(src)}
                  </span>
                ))}
              </dd>
            </div>
          )}
        </dl>
      </Section>

      <Section title={`Issues (${issues.length})`}>
        {issues.length === 0 ? (
          <p className="flex items-center gap-2 rounded border bg-ok-soft px-3 py-2 text-sm text-ok">
            <CheckCircle2 className="size-4" aria-hidden />
            No issues on this page.
          </p>
        ) : (
          <ul className="divide-y rounded border bg-card">
            {issues.map((issue) => (
              <li key={issue.type} className="space-y-1.5 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={issue.severity} />
                  <span className="text-sm font-medium">{issue.title}</span>
                  {issue.isNew && <NewBadge />}
                </div>
                <IssueDetails details={issue.details} />
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={`Linked from (${formatNumber(page.inlinksTotal ?? page.inlinksCount)})`}>
        {page.inlinks.length === 0 ? (
          <p className="rounded border border-dashed px-3 py-2 text-sm text-muted-foreground">No crawled page links here: visitors and Google can only find it through the sitemap or other sites.</p>
        ) : (
          <ul className="max-h-64 divide-y overflow-y-auto rounded border bg-card">
            {page.inlinks.map((l) => (
              <li key={l.url} className="flex items-center gap-2 px-3 py-1.5">
                <PageLink url={l.url} className="max-w-full" />
                {l.nofollow && <span className="rounded bg-muted px-1.5 py-0.5 text-2xs font-medium text-muted-foreground">nofollow</span>}
              </li>
            ))}
          </ul>
        )}
        {page.inlinks.length > 0 && page.inlinks.length < (page.inlinksTotal ?? page.inlinksCount) && (
          <p className="text-xs text-muted-foreground">Showing the first {formatNumber(page.inlinks.length)}.</p>
        )}
      </Section>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading the page">
      {[4, 6, 4].map((n, s) => (
        <div key={s} className="space-y-2">
          <Skeleton className="h-4 w-24 rounded" />
          <div className="grid gap-3 rounded border bg-card p-3 sm:grid-cols-4">
            {Array.from({ length: n }, (_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-2.5 w-14 rounded" />
                <Skeleton className={cn('h-3.5 rounded', ['w-20', 'w-12', 'w-24', 'w-16'][i % 4])} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
