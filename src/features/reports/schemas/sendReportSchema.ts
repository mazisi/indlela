import { z } from 'zod';
import { MAX_NOTE } from './generateReportSchema';
import { recipientsSchema } from './recipients';

export const sendReportSchema = z.object({
  recipients: recipientsSchema,
  message: z.string().trim().max(MAX_NOTE, `Keep the message under ${MAX_NOTE} characters.`),
});

export type SendReportValues = z.infer<typeof sendReportSchema>;
