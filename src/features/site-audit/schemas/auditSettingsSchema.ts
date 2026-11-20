import { z } from 'zod';

export const PAGE_LIMIT_MIN = 50;
export const PAGE_LIMIT_MAX = 5000;

export const auditSettingsSchema = z.object({
  auditSchedule: z.enum(['off', 'weekly', 'monthly'], { error: 'Choose how often to audit the site.' }),
  auditPageLimit: z
    .number({ error: 'Enter the most pages to crawl.' })
    .int('Use a whole number of pages.')
    .min(PAGE_LIMIT_MIN, `Crawl at least ${PAGE_LIMIT_MIN} pages.`)
    .max(PAGE_LIMIT_MAX, `Crawl at most ${PAGE_LIMIT_MAX.toLocaleString('en-GB')} pages.`),
});

export type AuditSettingsValues = z.infer<typeof auditSettingsSchema>;
