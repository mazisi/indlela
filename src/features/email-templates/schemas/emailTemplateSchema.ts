import { z } from 'zod';

/** The visible text of rich-text HTML (Quill leaves `<p><br></p>` when empty). */
export const textOf = (html: string) => html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

/** An email's wording; matches the API (subject ≤ 500, body ≤ 20 000). */
export const templateSchema = z.object({
  subject: z.string().trim().min(1, 'Enter a subject.').max(500, 'At most 500 characters.'),
  body: z.string().max(20000, 'The message is too long.').refine((v) => textOf(v) !== '', 'Enter the message.'),
});

export type TemplateFormValues = z.infer<typeof templateSchema>;
