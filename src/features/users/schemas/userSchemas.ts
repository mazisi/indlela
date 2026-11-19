import { z } from 'zod';
import { saPhoneDigits } from '@/utils/saPhone';

const roleId = z.number({ error: 'Choose a role.' }).int().positive('Choose a role.');

/**
 * Add or edit a user of the current workspace. A cell number is optional
 * unless the one-time PIN goes by SMS (as in the API). At least one client
 * unless the role sees every client (Owner, or a role with "Sees every
 * client"). The API checks that the address is free.
 */
const userFields = z.object({
  fullName: z.string().trim().min(1, 'Enter the first name.').max(100),
  surname: z.string().trim().min(1, 'Enter the surname.').max(100),
  email: z.string().trim().min(1, 'Enter the email address.').pipe(z.email('Enter a valid email address.')),
  mobile: z
    .string()
    .transform((v) => saPhoneDigits(v))
    .pipe(z.string().regex(/^(0\d{9})?$/, 'Enter a 10-digit cell number, e.g. 082 555 0100.')),
  mfaChannel: z.enum(['sms', 'email', 'off']),
  roleId,
  clientIds: z.array(z.number()),
  status: z.enum(['active', 'disabled', 'locked']).optional(),
});

export const userFormSchema = (allClientsRoleIds: readonly number[]) =>
  userFields.superRefine((v, ctx) => {
    if (v.mfaChannel === 'sms' && !v.mobile) {
      ctx.addIssue({ code: 'custom', path: ['mobile'], message: 'Add a cell number to send the PIN by SMS.' });
    }
    if (v.clientIds.length === 0 && !allClientsRoleIds.includes(v.roleId)) {
      ctx.addIssue({ code: 'custom', path: ['clientIds'], message: 'Give access to at least one client.' });
    }
  });

export type UserFormInput = z.input<typeof userFields>;
export type UserFormValues = z.output<typeof userFields>;
