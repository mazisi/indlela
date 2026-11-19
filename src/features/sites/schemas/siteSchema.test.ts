import { describe, expect, it } from 'vitest';
import { siteFormSchema } from './siteSchema';

const base = { clientId: 1, name: '', isActive: true };

describe('site form', () => {
  it.each(['example.co.za', 'www.example.co.za/shop', 'https://karoo.coffee', 'http://sub.domain.example.com'])('accepts %s', (url) => {
    expect(siteFormSchema.safeParse({ ...base, url }).success).toBe(true);
  });

  it.each(['', 'not a site', 'localhost', 'ftp://example.co.za'])('rejects %j', (url) => {
    expect(siteFormSchema.safeParse({ ...base, url }).success).toBe(false);
  });

  it('leaves the name to the API when blank', () => {
    expect(siteFormSchema.parse({ ...base, url: 'example.co.za', name: '  ' }).name).toBeNull();
  });
});
