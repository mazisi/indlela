import { z } from 'zod';
import { passwordMeetsRules } from '../lib/passwordRules';
import { saPhoneDigits } from '@/utils/saPhone';

const email = z.string().trim().min(1, 'Enter your email address.').pipe(z.email('Enter a valid email address.'));

/** New password + confirmation, checked against the email it belongs to. */
function withNewPassword<T extends z.ZodRawShape>(shape: T, emailOf: (data: Record<string, unknown>) => string) {
  return z
    .object({
      ...shape,
      password: z.string().min(1, 'Choose a password.'),
      passwordConfirmation: z.string().min(1, 'Confirm your password.'),
    })
    .superRefine((data, ctx) => {
      const values = data as Record<string, unknown> & { password: string; passwordConfirmation: string };
      if (!passwordMeetsRules(values.password, emailOf(values))) {
        ctx.addIssue({ code: 'custom', path: ['password'], message: 'The password does not meet the rules.' });
      }
      if (values.password !== values.passwordConfirmation) {
        ctx.addIssue({ code: 'custom', path: ['passwordConfirmation'], message: 'The passwords do not match.' });
      }
    });
}

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password.'),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const pinSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code.'),
});
export type PinValues = z.infer<typeof pinSchema>;

export const forgotPasswordSchema = z.object({ email });
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = withNewPassword(
  { token: z.string().min(1), email: z.string() },
  (data) => String(data.email ?? ''),
);
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

/** Workspace sign-up (POST /register): the person, and the agency or business they create. */
export const registerSchema = withNewPassword(
  {
    name: z.string().trim().min(2, 'Enter your name.').max(200),
    email,
    workspaceName: z.string().trim().min(2, 'Name your workspace: your agency or business.').max(100),
  },
  (data) => String(data.email ?? ''),
);
export type RegisterValues = z.infer<typeof registerSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password.'),
    password: z.string().min(1, 'Choose a new password.'),
    passwordConfirmation: z.string().min(1, 'Confirm your new password.'),
    email: z.string(),
  })
  .superRefine((data, ctx) => {
    if (!passwordMeetsRules(data.password, data.email)) {
      ctx.addIssue({ code: 'custom', path: ['password'], message: 'The password does not meet the rules.' });
    }
    if (data.password && data.password === data.currentPassword) {
      ctx.addIssue({ code: 'custom', path: ['password'], message: 'Choose a password you have not used before.' });
    }
    if (data.password !== data.passwordConfirmation) {
      ctx.addIssue({ code: 'custom', path: ['passwordConfirmation'], message: 'The passwords do not match.' });
    }
  });
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export const accountSchema = z
  .object({
    mobile: z.string().transform((v) => saPhoneDigits(v)),
    mfaChannel: z.enum(['email', 'sms', 'off']),
  })
  .superRefine((data, ctx) => {
    if (data.mobile && !/^0\d{9}$/.test(data.mobile)) {
      ctx.addIssue({ code: 'custom', path: ['mobile'], message: 'Enter a 10-digit cell number, e.g. 082 555 0100.' });
    }
    if (data.mfaChannel === 'sms' && !data.mobile) {
      ctx.addIssue({ code: 'custom', path: ['mobile'], message: 'Add a cell number to get your PIN by SMS.' });
    }
  });
export type AccountInput = z.input<typeof accountSchema>;
export type AccountValues = z.output<typeof accountSchema>;
