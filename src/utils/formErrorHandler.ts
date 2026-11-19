import type { UseFormSetError, FieldValues, Path } from 'react-hook-form';
import showToaster from '@/utils/showToaster';

// Bridges Laravel API errors to our forms. Ported from the supplier-portal
// pattern: 422 validation errors bind to the offending fields (react-hook-form
// + Zod), everything else falls back to a toast.

/** snake_case → camelCase for a single key (Laravel field → form field). */
function toCamel(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

/** Best-effort human-readable message from an unknown API error. */
export function getApiErrorMessage(error: unknown, fallback = 'Operation failed'): string {
  const axiosErr = error as { response?: { data?: { message?: unknown } } };
  const message = axiosErr?.response?.data?.message;
  return typeof message === 'string' && message ? message : fallback;
}

/**
 * Handle an API error against a form. On 422, each `errors[field]` is bound to
 * the matching form field via `setError` (keys are auto snake→camel'd; pass
 * `fieldMapping` to override) and the bound field names are returned (useful for
 * multi-step forms that need to jump to the offending step). Non-422 errors are
 * surfaced as a toast and an empty array is returned.
 */
export function handleApiValidationError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fieldMapping: Record<string, string> = {},
): string[] {
  const axiosErr = error as {
    response?: { status?: number; data?: { errors?: Record<string, string | string[]>; message?: string } };
  };
  const { status, data } = axiosErr.response ?? {};

  if (status === 422 && data?.errors) {
    const fields: string[] = [];
    for (const [field, messages] of Object.entries(data.errors)) {
      const formField = fieldMapping[field] ?? toCamel(field);
      fields.push(formField);
      setError(formField as Path<T>, {
        type: 'server',
        message: Array.isArray(messages) ? messages[0] : messages,
      });
    }
    return fields;
  }

  showToaster('error', getApiErrorMessage(error));
  return [];
}
