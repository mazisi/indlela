/**
 * The password rules (from workforce-app), shared by the Zod
 * schemas and the live checklist under every new-password field. The API
 * enforces the same rules (Password::defaults() + PasswordNotEmail).
 */
export interface PasswordRule {
  label: string;
  test: (password: string, email: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { label: 'Letters and numbers', test: (pw) => /[A-Za-z]/.test(pw) && /\d/.test(pw) },
  { label: 'At least one symbol (e.g. @ # !)', test: (pw) => /[^A-Za-z0-9]/.test(pw) },
  {
    label: 'Not the same as your email',
    test: (pw, email) => pw.length > 0 && pw.toLowerCase() !== (email.split('@')[0] ?? '').toLowerCase(),
  },
];

export function passwordMeetsRules(password: string, email: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password, email));
}
