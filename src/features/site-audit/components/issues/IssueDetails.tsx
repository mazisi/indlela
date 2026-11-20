import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { PageLink } from '@/features/search-console/components/reports/cells';
import { formatNumber, pagePath } from '@/features/search-console/lib/format';
import { cn } from '@/lib/utils';
import type { IssueDetails as Details } from '../../types';

/*
 * An affected URL's details differ by issue type (a redirect chain, the
 * duplicated title, the broken link's status and the page linking to it…).
 * They are drawn by what they contain rather than by type name, so a new
 * issue type with familiar keys needs nothing here, and an unfamiliar key
 * still shows as "Label: value".
 */

type Hop = string | { url: string; statusCode?: number | null; status?: number | null };

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const hopUrl = (h: Hop) => (typeof h === 'string' ? h : h.url);
const hopStatus = (h: Hop) => (typeof h === 'string' ? undefined : (h.statusCode ?? h.status ?? undefined));

/** 404 red, 3xx amber, 2xx green. */
export function StatusCode({ code }: { code: number | null | undefined }) {
  if (code === null || code === undefined) return <span className="text-xs text-muted-foreground">—</span>;
  const tone = code >= 400 ? 'bg-bad-soft text-bad' : code >= 300 ? 'bg-warn-soft text-warn' : code >= 200 ? 'bg-ok-soft text-ok' : 'bg-muted text-muted-foreground';
  return <span className={cn('inline-flex rounded px-1.5 py-0.5 font-mono text-2xs font-semibold tabular-nums', tone)}>{code === 0 ? 'No reply' : code}</span>;
}

/** `/a → /b → /c`, each hop with its status when known. */
export function RedirectChain({ hops }: { hops: Hop[] }) {
  return (
    <ol aria-label={`Redirect chain of ${hops.length} steps`} className="flex flex-wrap items-center gap-1 font-mono text-xs">
      {hops.map((h, i) => (
        <li key={`${hopUrl(h)}-${i}`} className="inline-flex items-center gap-1">
          {i > 0 && <ArrowRight className="size-3 text-muted-foreground" aria-label="redirects to" />}
          <span className="max-w-64 truncate" title={hopUrl(h)}>
            {pagePath(hopUrl(h))}
          </span>
          {hopStatus(h) !== undefined && <StatusCode code={hopStatus(h)} />}
        </li>
      ))}
    </ol>
  );
}

function Quoted({ label, text }: { label: string; text: unknown }) {
  const value = typeof text === 'string' ? text : '';
  return (
    <span className="block min-w-0">
      <span className="text-muted-foreground">{label}: </span>
      {value ? <q className="break-words text-foreground">{value}</q> : <span className="italic text-muted-foreground">empty</span>}
    </span>
  );
}

function Links({ label, urls }: { label: string; urls: string[] }) {
  if (urls.length === 0) return null;
  const shown = urls.slice(0, 3);
  return (
    <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
      <span className="text-muted-foreground">{label}:</span>
      {shown.map((u) => (
        <PageLink key={u} url={u} className="max-w-56" />
      ))}
      {urls.length > shown.length && <span className="text-muted-foreground">+{urls.length - shown.length} more</span>}
    </span>
  );
}

const asUrls = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((x) => (typeof x === 'string' ? x : isRecord(x) && typeof x.url === 'string' ? x.url : '')).filter(Boolean) : typeof v === 'string' ? [v] : [];

/** "metaDescription" → "Meta description". */
const humanise = (key: string) =>
  key
    .replace(/([A-Z])/g, ' $1')
    .toLowerCase()
    .replace(/^./, (c) => c.toUpperCase())
    .replace(/\burl\b/gi, 'URL');

function scalar(v: unknown): string {
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'number') return formatNumber(v);
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return v.map(scalar).join(', ');
  return isRecord(v) ? JSON.stringify(v) : '—';
}

const statusLine = (label: string, code: unknown) =>
  typeof code === 'number' ? (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-muted-foreground">{label}</span>
      <StatusCode code={code} />
    </span>
  ) : null;

const linkLine = (label: string, url: unknown) =>
  typeof url === 'string' && url ? (
    <span className="flex min-w-0 flex-wrap items-center gap-1.5">
      <span className="text-muted-foreground">{label}</span>
      <PageLink url={url} className="max-w-72" />
    </span>
  ) : null;

const plural = (n: number, one: string, many = `${one}s`) => `${formatNumber(n)} ${n === 1 ? one : many}`;

interface Renderer {
  /** Drawn when any of these is present (the first one found is passed in). */
  keys: string[];
  /** Further keys this renderer shows, left out of the generic list. */
  uses?: string[];
  render: (d: Details, key: string) => ReactNode;
}

/**
 * Each familiar key (as the API's AuditAnalyser writes them, camelCased),
 * drawn its own way; anything else falls through to "Label: value".
 */
const RENDERERS: Renderer[] = [
  // redirect_chain, redirect_loop: [{url, statusCode}…], with the hop count and where it ends.
  { keys: ['chain', 'redirectChain', 'hops'], uses: ['redirects', 'finalUrl'], render: (d, k) => (Array.isArray(d[k]) ? <RedirectChain hops={d[k] as Hop[]} /> : null) },
  // broken_internal_link, broken_external_link, internal_link_to_redirect: the row is the linking page; this is where it links.
  {
    keys: ['toUrl', 'targetUrl', 'linkUrl'],
    uses: ['kind'],
    render: (d, k) => linkLine(d.kind === 'image' ? 'Image' : 'Links to', d[k]),
  },
  { keys: ['statusCode', 'status'], render: (d, k) => statusLine('Status', d[k]) },
  { keys: ['finalUrl'], render: (d) => linkLine('Ends at', d.finalUrl) },
  { keys: ['finalStatusCode'], render: (d) => statusLine('Final status', d.finalStatusCode) },
  { keys: ['linkedFrom', 'foundOn', 'sourceUrl', 'sources', 'linkingPages', 'inlinks'], render: (d, k) => <Links label="Linked from" urls={asUrls(d[k])} /> },
  { keys: ['title'], render: (d) => <Quoted label="Title" text={d.title} /> },
  { keys: ['metaDescription', 'description'], render: (d, k) => <Quoted label="Description" text={d[k]} /> },
  { keys: ['h1'], uses: ['h1Count'], render: (d) => <Quoted label={typeof d.h1Count === 'number' ? `H1 (${d.h1Count} on the page)` : 'H1'} text={d.h1} /> },
  {
    keys: ['canonical', 'canonicalUrl'],
    uses: ['canonicalCount'],
    render: (d, k) => (
      <span className="flex min-w-0 flex-wrap items-center gap-1.5">
        <span className="text-muted-foreground">{typeof d.canonicalCount === 'number' && d.canonicalCount > 1 ? `${d.canonicalCount} canonical tags, first` : 'Canonical'}</span>
        <ArrowRight className="size-3 text-muted-foreground" aria-label="points to" />
        {typeof d[k] === 'string' && d[k] ? <PageLink url={d[k] as string} className="max-w-64" /> : <span className="italic text-muted-foreground">none</span>}
      </span>
    ),
  },
  // duplicate_title, duplicate_meta_description: `pages` uses it (this one included), up to 5 `otherUrls`.
  {
    keys: ['otherUrls', 'pages', 'duplicateCount'],
    uses: ['otherUrls', 'pages', 'duplicateCount'],
    render: (d) => {
      const urls = asUrls(d.otherUrls);
      const others = typeof d.pages === 'number' ? d.pages - 1 : typeof d.duplicateCount === 'number' ? d.duplicateCount : urls.length;
      const label = `Shared with ${plural(others, 'other page')}`;
      return urls.length ? <Links label={label} urls={urls} /> : <span className="text-muted-foreground">{label}</span>;
    },
  },
  // images_missing_alt: how many of the page's images, and their addresses.
  {
    keys: ['images', 'missingAltImages'],
    uses: ['count', 'imagesCount'],
    render: (d, k) => {
      const srcs = asUrls(d[k]);
      const n = typeof d.count === 'number' ? d.count : srcs.length;
      const of = typeof d.imagesCount === 'number' ? ` of ${formatNumber(d.imagesCount)}` : '';
      return (
        <span className="block min-w-0">
          <span className="text-muted-foreground">
            {formatNumber(n)}
            {of} {n === 1 && !of ? 'image' : 'images'} without alt text{srcs.length ? ': ' : ''}
          </span>
          <span className="break-all font-mono">{srcs.slice(0, 3).map(pagePath).join(', ')}</span>
          {srcs.length > 3 && <span className="text-muted-foreground"> +{srcs.length - 3} more</span>}
        </span>
      );
    },
  },
  // poor / needs-improvement Core Web Vitals: the device, score and readings.
  {
    keys: ['performanceScore', 'strategy'],
    uses: ['performanceScore', 'strategy', 'lab', 'field'],
    render: (d) => {
      const device = d.strategy === 'desktop' ? 'Desktop' : 'Mobile';
      const score = typeof d.performanceScore === 'number' ? `performance score ${d.performanceScore}` : 'no performance score';
      return (
        <span className="text-muted-foreground">
          {device}: {score}
        </span>
      );
    },
  },
  { keys: ['length', 'chars', 'characters'], render: (d, k) => <span className="text-muted-foreground">{plural(d[k] as number, 'character')}</span> },
  { keys: ['responseMs'], render: (d) => <span className="text-muted-foreground">Responded in {formatNumber(d.responseMs as number)} ms</span> },
  { keys: ['wordCount'], render: (d) => <span className="text-muted-foreground">{plural(d.wordCount as number, 'word')}</span> },
  { keys: ['inlinksCount'], render: (d) => <span className="text-muted-foreground">Linked from {plural(d.inlinksCount as number, 'page')}</span> },
  { keys: ['robotsUrl'], render: (d) => linkLine('robots.txt', d.robotsUrl) },
  { keys: ['checked'], render: (d) => <Links label="Checked" urls={asUrls(d.checked)} /> },
  { keys: ['url'], render: (d) => linkLine('Served at', d.url) },
];

/** An affected URL's details, drawn per kind of detail; nothing when there are none. */
export function IssueDetails({ details, fallback = null }: { details: Details | null | undefined; fallback?: ReactNode }) {
  const empty = fallback === null ? null : <span className="text-xs text-muted-foreground">{fallback}</span>;
  if (!details || Object.keys(details).length === 0) return empty;
  const used = new Set<string>();
  const parts: ReactNode[] = [];
  for (const { keys, uses = [], render } of RENDERERS) {
    const key = keys.find((k) => details[k] !== undefined && details[k] !== null && !used.has(k));
    if (!key) continue;
    [...keys, ...uses].forEach((k) => used.add(k));
    const node = render(details, key);
    if (node) parts.push(<li key={key}>{node}</li>);
  }
  for (const [key, value] of Object.entries(details)) {
    if (used.has(key) || value === null || value === undefined || value === '') continue;
    parts.push(
      <li key={key}>
        <span className="text-muted-foreground">{humanise(key)}: </span>
        <span className="break-words">{scalar(value)}</span>
      </li>,
    );
  }
  return parts.length ? <ul className="space-y-1 text-xs">{parts}</ul> : empty;
}
