import { describe, expect, it } from 'vitest';
import { describeChange } from './change';
import { rangeFor } from './dateRange';
import { decidePageState, needsPolling, pickSite } from './pageState';
import { describeSync, timeAgo } from './syncStatus';
import { suggestProperty } from './properties';
import type { GoogleConnection, GscSite } from '../types';

const site = (over: Partial<GscSite> = {}): GscSite => ({
  id: 1,
  name: 'Karoo Coffee',
  url: 'https://www.karoocoffee.co.za',
  client: { id: 1, name: 'Karoo Coffee Co' },
  gscProperty: 'sc-domain:karoocoffee.co.za',
  gscSyncStatus: 'done',
  gscSyncedAt: '2026-11-20T08:00:00+02:00',
  gscDataThrough: '2026-11-18',
  gscSyncError: null,
  ...over,
});

const connection: GoogleConnection = {
  id: 1,
  googleEmail: 'seo@agency.co.za',
  status: 'active',
  lastError: null,
  connectedBy: { id: 1, name: 'Johan' },
  connectedAt: '2026-11-19T10:00:00+02:00',
};

describe('describeChange', () => {
  it('colours more clicks green and fewer red', () => {
    expect(describeChange(12, 'higher')).toMatchObject({ tone: 'good', arrow: 'up', word: 'up' });
    expect(describeChange(-3, 'higher')).toMatchObject({ tone: 'bad', arrow: 'down', word: 'down' });
  });

  it('treats a lower position as better (inverse)', () => {
    expect(describeChange(-1.5, 'lower')).toMatchObject({ tone: 'good', arrow: 'up', word: 'improved' });
    expect(describeChange(2, 'lower')).toMatchObject({ tone: 'bad', arrow: 'down', word: 'worsened' });
  });

  it('is flat when nothing changed', () => {
    expect(describeChange(0, 'lower').tone).toBe('flat');
  });
});

describe('rangeFor', () => {
  it('ends on the last day with data', () => {
    expect(rangeFor('7d', '2026-11-18')).toEqual({ start: '2026-11-12', end: '2026-11-18' });
    expect(rangeFor('28d', '2026-11-18')).toEqual({ start: '2026-10-22', end: '2026-11-18' });
    expect(rangeFor('16m', '2026-11-18')).toEqual({ start: '2025-07-19', end: '2026-11-18' });
  });

  it('falls back to yesterday without data', () => {
    expect(rangeFor('90d', null, new Date(2026, 10, 20))).toEqual({ start: '2026-08-22', end: '2026-11-19' });
  });
});

describe('decidePageState', () => {
  it('walks connection → sites → link → import → dashboard', () => {
    expect(decidePageState(null, [site()], undefined).kind).toBe('not_connected');
    expect(decidePageState(connection, [], undefined).kind).toBe('no_sites');
    expect(decidePageState(connection, [site({ gscProperty: null })], undefined).kind).toBe('not_linked');
    expect(decidePageState(connection, [site({ gscDataThrough: null, gscSyncStatus: 'syncing' })], undefined).kind).toBe('importing');
    expect(decidePageState(connection, [site({ gscDataThrough: null, gscSyncStatus: 'failed' })], undefined).kind).toBe('import_failed');
    expect(decidePageState(connection, [site()], undefined).kind).toBe('ready');
  });

  it('picks the site in the URL, else the first linked one', () => {
    const a = site({ id: 1, gscProperty: null });
    const b = site({ id: 2 });
    expect(pickSite([a, b], undefined)?.id).toBe(2);
    expect(pickSite([a, b], 1)?.id).toBe(1);
    expect(pickSite([a, b], 99)?.id).toBe(2);
  });

  it('polls only while a linked site is importing', () => {
    expect(needsPolling([site()])).toBe(false);
    expect(needsPolling([site({ gscSyncStatus: 'queued' })])).toBe(true);
    expect(needsPolling([site({ gscDataThrough: null, gscSyncStatus: 'idle' })])).toBe(true);
    expect(needsPolling([site({ gscDataThrough: null, gscSyncStatus: 'failed' })])).toBe(false);
    expect(needsPolling([site({ gscProperty: null, gscDataThrough: null })])).toBe(false);
  });
});

describe('sync status', () => {
  const now = new Date('2026-11-20T10:00:00+02:00');

  it('says when it last synced and how far the data goes', () => {
    expect(describeSync(site(), now)).toEqual({ tone: 'ok', label: 'Synced 2 h ago · data through 18/11/2026' });
    expect(describeSync(site({ gscSyncStatus: 'syncing' }), now).label).toBe('Syncing…');
    expect(describeSync(site({ gscSyncStatus: 'failed', gscSyncError: 'Quota exceeded' }), now).label).toBe('Failed: Quota exceeded');
  });

  it('rounds time ago', () => {
    expect(timeAgo('2026-11-20T09:59:30+02:00', now)).toBe('just now');
    expect(timeAgo('2026-11-20T09:15:00+02:00', now)).toBe('45 min ago');
    expect(timeAgo('2026-11-18T09:00:00+02:00', now)).toBe('2 days ago');
  });
});

describe('suggestProperty', () => {
  it("prefers the domain property matching the site's host", () => {
    const props = [
      { siteUrl: 'https://www.karoocoffee.co.za/', permissionLevel: 'siteFullUser' },
      { siteUrl: 'sc-domain:karoocoffee.co.za', permissionLevel: 'siteOwner' },
      { siteUrl: 'sc-domain:other.co.za', permissionLevel: 'siteOwner' },
    ];
    expect(suggestProperty(props, 'https://www.karoocoffee.co.za')).toBe('sc-domain:karoocoffee.co.za');
    expect(suggestProperty(props.slice(0, 1), 'https://karoocoffee.co.za')).toBe('https://www.karoocoffee.co.za/');
    expect(suggestProperty(props, 'https://nomatch.co.za')).toBeUndefined();
  });
});
