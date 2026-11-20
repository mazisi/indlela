import { z } from 'zod';
import { toYmd } from '../lib/period';
import { MAX_RECIPIENTS } from '../lib/schedule';
import { emailSchema } from './recipients';

/** As the API allows (StoreReportRequest). */
export const MAX_TITLE = 200;
export const MAX_NOTE = 2000;
/** The API keeps 16 months of Search Console data. */
export const MAX_RANGE_DAYS = 366;

const DAY = 86_400_000;

export const generateReportSchema = z
  .object({
    period: z.enum(['last_month', 'this_month', 'month', 'last_3_months', 'custom']),
    /** 'YYYY-MM' when period is 'month'. */
    month: z.string(),
    start: z.string(),
    end: z.string(),
    compare: z.enum(['previous', 'year', 'none']),
    sections: z.array(z.enum(['search_console', 'rank_tracking', 'site_audit'])).min(1, 'Choose at least one section.'),
    title: z.string().trim().max(MAX_TITLE, `Keep the title under ${MAX_TITLE} characters.`),
    note: z.string().trim().max(MAX_NOTE, `Keep the note under ${MAX_NOTE} characters.`),
    sendWhenReady: z.boolean(),
    sendTo: z.array(emailSchema).max(MAX_RECIPIENTS, `Add at most ${MAX_RECIPIENTS} email addresses.`),
  })
  .superRefine((v, ctx) => {
    if (v.sendWhenReady && v.sendTo.length === 0) ctx.addIssue({ code: 'custom', path: ['sendTo'], message: 'Add at least one email address.' });
    if (v.period === 'month' && !/^\d{4}-\d{2}$/.test(v.month)) ctx.addIssue({ code: 'custom', path: ['month'], message: 'Choose a month.' });
    if (v.period !== 'custom') return;
    if (!v.start) ctx.addIssue({ code: 'custom', path: ['start'], message: 'Choose the first day.' });
    if (!v.end) ctx.addIssue({ code: 'custom', path: ['end'], message: 'Choose the last day.' });
    if (!v.start || !v.end) return;
    if (v.end > toYmd(new Date())) ctx.addIssue({ code: 'custom', path: ['end'], message: "The last day can't be in the future." });
    else if (v.start > v.end) ctx.addIssue({ code: 'custom', path: ['end'], message: 'The last day must be on or after the first.' });
    else if ((Date.parse(v.end) - Date.parse(v.start)) / DAY + 1 > MAX_RANGE_DAYS) ctx.addIssue({ code: 'custom', path: ['end'], message: 'Choose at most a year.' });
  });

export type GenerateReportValues = z.infer<typeof generateReportSchema>;
