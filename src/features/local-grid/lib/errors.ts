/** The status and `error_type` of an API error (error bodies stay snake_case). */
export function apiErrorOf(error: unknown): { status?: number; errorType?: string } {
  const res = (error as { response?: { status?: number; data?: { error_type?: string } } } | null)?.response;
  return { status: res?.status, errorType: res?.data?.error_type };
}

/** Grid and scan routes answer 403/404 when it isn't there, or not yours. */
export const isNotFound = (error: unknown) => [403, 404].includes(apiErrorOf(error).status ?? 0);

/**
 * Laravel names nested errors `business.title`, `business.lat`: bind them to
 * the form's field for the whole object.
 */
export function rootFieldErrors(error: unknown): unknown {
  const res = (error as { response?: { status?: number; data?: { errors?: Record<string, string[]> } } }).response;
  if (res?.status !== 422 || !res.data?.errors) return error;
  const errors: Record<string, string[]> = {};
  for (const [key, messages] of Object.entries(res.data.errors)) errors[key.split('.')[0]] ??= messages;
  return { ...(error as object), response: { ...res, data: { ...res.data, errors } } };
}
