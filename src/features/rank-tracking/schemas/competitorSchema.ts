import { z } from 'zod';
import { MAX_RECIPIENTS } from '@/features/reports/lib/schedule';
import { emailSchema } from '@/features/reports/schemas/recipients';
import { normaliseDomain } from '../lib/competitors';

export const COMPETITOR_NAME_MAX = 120;

const name = z.string().trim().max(COMPETITOR_NAME_MAX, `At most ${COMPETITOR_NAME_MAX} characters.`);

/** Add a competitor: a domain or any URL on it (the API keeps the bare host), and an optional label. */
export const addCompetitorSchema = z.object({
  domain: z
    .string()
    .trim()
    .min(1, 'Enter the competitor’s domain, e.g. beanthere.co.za.')
    .max(2048)
    .refine((v) => normaliseDomain(v) !== null, 'Enter a domain like beanthere.co.za or a link to their site.'),
  name,
});

export type AddCompetitorValues = z.infer<typeof addCompetitorSchema>;

/** Rename: blank goes back to the domain. */
export const renameCompetitorSchema = z.object({ name });

export type RenameCompetitorValues = z.infer<typeof renameCompetitorSchema>;

/** Overtake alert emails: none (no emails) up to the reports' limit of 10. */
export const alertRecipientsSchema = z.object({
  alertRecipients: z.array(emailSchema).max(MAX_RECIPIENTS, `Add at most ${MAX_RECIPIENTS} email addresses.`),
});

export type AlertRecipientsValues = z.infer<typeof alertRecipientsSchema>;
