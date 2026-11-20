/**
 * Laravel names array errors `recipients.3`, `sections.0`: bind them to the
 * form field for the whole list (`recipients`, `sections`).
 */
export function rootFieldErrors(error: unknown): unknown {
  const res = (error as { response?: { status?: number; data?: { errors?: Record<string, string[]> } } }).response;
  if (res?.status !== 422 || !res.data?.errors) return error;
  const errors: Record<string, string[]> = {};
  for (const [key, messages] of Object.entries(res.data.errors)) {
    errors[key.split('.')[0]] ??= messages;
  }
  return { ...(error as object), response: { ...res, data: { ...res.data, errors } } };
}

export const errorType = (error: unknown) => (error as { response?: { status?: number; data?: { error_type?: string } } }).response;
