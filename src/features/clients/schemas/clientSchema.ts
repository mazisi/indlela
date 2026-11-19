import { z } from 'zod';

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `At most ${max} characters.`)
    .transform((v) => v || null);

/** Add or edit a client; matches the API's ClientRequest (the name is unique in the workspace there). */
export const clientFormSchema = z.object({
  name: z.string().trim().min(2, 'Enter the client name.').max(120, 'At most 120 characters.'),
  contactName: optional(120),
  contactEmail: z
    .string()
    .trim()
    .pipe(z.union([z.literal(''), z.email('Enter a valid email address.')]))
    .transform((v) => v.toLowerCase() || null),
  notes: optional(2000),
  isActive: z.boolean(),
});

export type ClientFormInput = z.input<typeof clientFormSchema>;
export type ClientFormValues = z.output<typeof clientFormSchema>;
