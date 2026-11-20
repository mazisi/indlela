import type { GoogleConnection, GscSite } from '../types';
import { isSyncing } from './syncStatus';

/**
 * What the Search Console page shows, in order of precedence:
 * no Google account → connect; no sites → add one; site not linked to a
 * property → pick one; linked without data yet → importing (or failed);
 * otherwise the dashboard.
 */
export type ScPageState =
  | { kind: 'not_connected' }
  | { kind: 'no_sites' }
  | { kind: 'not_linked'; site: GscSite }
  | { kind: 'importing'; site: GscSite }
  | { kind: 'import_failed'; site: GscSite }
  | { kind: 'ready'; site: GscSite };

/** The site in the URL if the user can see it, else the first linked site, else the first site. */
export function pickSite(sites: GscSite[], siteId: number | undefined): GscSite | undefined {
  return sites.find((s) => s.id === siteId) ?? sites.find((s) => s.gscProperty) ?? sites[0];
}

export function decidePageState(connection: GoogleConnection | null, sites: GscSite[], siteId: number | undefined): ScPageState {
  if (!connection) return { kind: 'not_connected' };
  const site = pickSite(sites, siteId);
  if (!site) return { kind: 'no_sites' };
  if (!site.gscProperty) return { kind: 'not_linked', site };
  if (!site.gscDataThrough) {
    return site.gscSyncStatus === 'failed' && !isSyncing(site) ? { kind: 'import_failed', site } : { kind: 'importing', site };
  }
  return { kind: 'ready', site };
}

/** Keep polling the sites while any linked site is importing, so the page moves on by itself. */
export const needsPolling = (sites: GscSite[] | undefined) =>
  Boolean(sites?.some((s) => s.gscProperty && (isSyncing(s) || (!s.gscDataThrough && s.gscSyncStatus !== 'failed'))));
