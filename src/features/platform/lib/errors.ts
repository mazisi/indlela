/** The HTTP status of an axios-shaped error, if any. */
export const statusOf = (error: unknown): number | undefined => (error as { response?: { status?: number } } | null)?.response?.status;
