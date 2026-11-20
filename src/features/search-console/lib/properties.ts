import type { GscProperty } from '../types';

const LEVELS: Record<string, string> = {
  siteOwner: 'Owner',
  siteFullUser: 'Full user',
  siteRestrictedUser: 'Restricted user',
  siteUnverifiedUser: 'Unverified',
};

/** Google's permission level in words. */
export const permissionLabel = (level: string) => LEVELS[level] ?? level;

/** "sc-domain:example.co.za" → "example.co.za" (domain property); URL-prefix properties stay as they are. */
export function propertyLabel(siteUrl: string): { name: string; kind: string } {
  return siteUrl.startsWith('sc-domain:')
    ? { name: siteUrl.slice('sc-domain:'.length), kind: 'Domain property' }
    : { name: siteUrl, kind: 'URL-prefix property' };
}

const bareHost = (url: string) => {
  if (url.startsWith('sc-domain:')) return url.slice('sc-domain:'.length).replace(/^www\./, '');
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^www\./, '');
  }
};

/** The property that matches the site's domain, preferring a domain property (it covers every subdomain and protocol). */
export function suggestProperty(properties: GscProperty[], siteUrl: string): string | undefined {
  const host = bareHost(siteUrl);
  const matches = properties.filter((p) => bareHost(p.siteUrl) === host && p.permissionLevel !== 'siteUnverifiedUser');
  return (matches.find((p) => p.siteUrl.startsWith('sc-domain:')) ?? matches[0])?.siteUrl;
}
