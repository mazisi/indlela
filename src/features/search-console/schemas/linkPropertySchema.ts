import { z } from 'zod';

export const linkPropertySchema = z.object({
  property: z.string().min(1, 'Choose a Search Console property'),
});

export type LinkPropertyValues = z.infer<typeof linkPropertySchema>;
