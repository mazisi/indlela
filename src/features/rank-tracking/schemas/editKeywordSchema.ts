import { z } from 'zod';
import { refineTags } from './addKeywordsSchema';

export const editKeywordSchema = z
  .object({
    frequency: z.enum(['daily', 'weekly'], { error: 'Choose how often to check.' }),
    /** 0 = Sunday … 6 = Saturday, as a string for the Select; required for weekly checks. */
    weeklyDay: z.string(),
    tagsText: z.string().superRefine(refineTags),
    isActive: z.boolean(),
  })
  .refine((v) => v.frequency === 'daily' || /^[0-6]$/.test(v.weeklyDay), { message: 'Choose the day of the week.', path: ['weeklyDay'] });

export type EditKeywordValues = z.infer<typeof editKeywordSchema>;
