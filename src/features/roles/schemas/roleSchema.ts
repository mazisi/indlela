import { z } from 'zod';

export const roleFormSchema = z.object({
  name: z.string().trim().min(2, 'Enter the role name.').max(60, 'Keep the name under 60 characters.'),
  description: z.string().trim().max(160, 'Keep the description under 160 characters.'),
  allClients: z.boolean(),
});

export type RoleFormValues = z.infer<typeof roleFormSchema>;
