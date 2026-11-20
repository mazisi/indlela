import { describe, expect, it } from 'vitest';
import { addCompetitorSchema, alertRecipientsSchema } from '../schemas/competitorSchema';
import { overview } from '../test/fixtures';
import { competitorColors, formatShare, historyIsRecent, isAhead, isSameOrSubdomain, normaliseDomain, OTHER_COLOR, SITE_COLOR, sovSeries } from './competitors';

describe('normaliseDomain', () => {
  it.each([
    ['beanthere.co.za', 'beanthere.co.za'],
    ['https://www.BeanThere.co.za/shop?x=1', 'beanthere.co.za'],
    ['www.beanthere.co.za/', 'beanthere.co.za'],
    ['http://shop.beanthere.co.za', 'shop.beanthere.co.za'],
    ['  truthcoffee.com  ', 'truthcoffee.com'],
  ])('%s → %s', (input, host) => expect(normaliseDomain(input)).toBe(host));

  it.each(['', 'beanthere', 'not a domain', 'ftp://beanthere.co.za', 'bean_there.co.za', 'beanthere.'])('refuses %j', (input) => expect(normaliseDomain(input)).toBeNull());
});

describe('competitor helpers', () => {
  it('matches subdomains of a domain only', () => {
    expect(isSameOrSubdomain('shop.karoocoffee.co.za', 'karoocoffee.co.za')).toBe(true);
    expect(isSameOrSubdomain('karoocoffee.co.za', 'karoocoffee.co.za')).toBe(true);
    expect(isSameOrSubdomain('notkaroocoffee.co.za', 'karoocoffee.co.za')).toBe(false);
  });

  it('counts out of the top 100 as 101 when comparing', () => {
    expect(isAhead(2, 4)).toBe(true);
    expect(isAhead(5, 4)).toBe(false);
    expect(isAhead(90, null)).toBe(true);
    expect(isAhead(null, 90)).toBe(false);
    expect(isAhead(null, null)).toBe(false);
  });

  it('gives each competitor a colour by the order it was added, never by rank, and folds past the last slot', () => {
    const colors = competitorColors([{ id: 30 }, { id: 12 }, { id: 21 }, { id: 40 }, { id: 41 }, { id: 42 }]);
    expect(colors.get(12)).toBe('var(--series-2)');
    expect(colors.get(21)).toBe('var(--series-3)');
    expect(colors.get(30)).toBe('var(--series-4)');
    expect(colors.get(41)).toBe('var(--series-6)');
    expect(colors.get(42)).toBe(OTHER_COLOR);
    // Removing one from what's shown doesn't repaint the rest.
    expect(competitorColors([{ id: 12 }, { id: 21 }, { id: 30 }]).get(30)).toBe('var(--series-4)');
  });

  it('orders share-of-voice series: the site first, then competitors by id', () => {
    const series = sovSeries(overview(), competitorColors([{ id: 11 }, { id: 12 }]));
    expect(series.map((s) => s.key)).toEqual(['site', 'c11', 'c12']);
    expect(series[0]).toMatchObject({ isSite: true, color: SITE_COLOR, domain: 'karoocoffee.co.za', stats: { sov: 50 } });
    expect(series[1]).toMatchObject({ name: 'Bean There', color: 'var(--series-2)' });
  });

  it('formats a share with a decimal only under 10%', () => {
    expect(formatShare(42.36)).toBe('42%');
    expect(formatShare(4.25)).toBe('4.3%');
    expect(formatShare(3)).toBe('3%');
    expect(formatShare(0)).toBe('0%');
    expect(formatShare(null)).toBe('—');
  });

  it('calls history recent inside the trend’s 12 weeks', () => {
    const today = new Date('2026-11-20T12:00:00');
    expect(historyIsRecent('2026-10-27', today)).toBe(true);
    expect(historyIsRecent('2026-06-01', today)).toBe(false);
    expect(historyIsRecent(null, today)).toBe(false);
  });
});

describe('competitor schemas', () => {
  it('takes a domain or URL and an optional name', () => {
    expect(addCompetitorSchema.safeParse({ domain: 'https://beanthere.co.za/shop', name: '' }).success).toBe(true);
    const bad = addCompetitorSchema.safeParse({ domain: 'bean there', name: '' });
    expect(bad.success).toBe(false);
    expect(bad.error?.issues[0].message).toBe('Enter a domain like beanthere.co.za or a link to their site.');
  });

  it('allows no alert recipients, but not more than 10 or a typo', () => {
    expect(alertRecipientsSchema.safeParse({ alertRecipients: [] }).success).toBe(true);
    expect(alertRecipientsSchema.safeParse({ alertRecipients: ['nope'] }).success).toBe(false);
    expect(alertRecipientsSchema.safeParse({ alertRecipients: Array.from({ length: 11 }, (_, i) => `a${i}@x.co.za`) }).success).toBe(false);
  });
});
