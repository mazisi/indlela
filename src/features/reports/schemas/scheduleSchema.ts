import { z } from 'zod';
import { MAX_DAY, MIN_DAY } from '../lib/schedule';
import { MAX_NOTE } from './generateReportSchema';
import { recipientsSchema } from './recipients';

/** As the API's ReportScheduleRequest: 1–10 recipients even while off (they are kept for turning it back on). */
export const scheduleSchema = z.object({
  isActive: z.boolean(),
  dayOfMonth: z.number({ error: 'Choose a day.' }).int().min(MIN_DAY, `Choose a day from ${MIN_DAY} to ${MAX_DAY}.`).max(MAX_DAY, `Choose a day from ${MIN_DAY} to ${MAX_DAY}.`),
  sendHour: z.number({ error: 'Choose a time.' }).int().min(0, 'Choose a time.').max(23, 'Choose a time.'),
  recipients: recipientsSchema,
  sections: z.array(z.enum(['search_console', 'rank_tracking', 'site_audit'])).min(1, 'Choose at least one section.'),
  compare: z.enum(['previous', 'year', 'none']),
  note: z.string().trim().max(MAX_NOTE, `Keep the note under ${MAX_NOTE} characters.`),
});

export type ScheduleValues = z.infer<typeof scheduleSchema>;
