import type { AuthErrorType } from '../types';

export interface AuthErrorBody {
  message?: string;
  error_type?: AuthErrorType;
  errors?: Record<string, string[]>;
  attempts_left?: number;
  retry_after?: number;
}

/** The API's error body, or an empty object for network failures. */
export function authErrorBody(error: unknown): AuthErrorBody {
  const body = (error as { response?: { data?: unknown } })?.response?.data;
  return body && typeof body === 'object' ? (body as AuthErrorBody) : {};
}

export function authErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const { message } = authErrorBody(error);
  if (message) return message;
  const status = (error as { response?: { status?: number } })?.response?.status;
  return status ? fallback : 'We could not reach Indlela. Check your connection and try again.';
}
