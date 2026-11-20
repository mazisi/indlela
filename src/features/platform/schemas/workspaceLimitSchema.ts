import { z } from 'zod';

export const KEYWORD_LIMIT_MIN = 10;
export const KEYWORD_LIMIT_MAX = 100_000;

/**
 * A workspace's keyword limit: the platform default, or its own number.
 * `limit` is the input's text, checked only for a custom limit.
 */
export const workspaceLimitSchema = z
  .object({
    mode: z.enum(['default', 'custom']),
    limit: z.string(),
  })
  .superRefine((v, ctx) => {
    if (v.mode !== 'custom') return;
    const text = v.limit.trim();
    const n = Number(text);
    const message =
      text === ''
        ? 'Enter the most keywords this workspace may track.'
        : !Number.isInteger(n)
          ? 'Use a whole number of keywords.'
          : n < KEYWORD_LIMIT_MIN
            ? `Allow at least ${KEYWORD_LIMIT_MIN} keywords.`
            : n > KEYWORD_LIMIT_MAX
              ? `Allow at most ${KEYWORD_LIMIT_MAX.toLocaleString('en-GB')} keywords.`
              : null;
    if (message) ctx.addIssue({ code: 'custom', message, path: ['limit'] });
  });

export type WorkspaceLimitValues = z.infer<typeof workspaceLimitSchema>;

/** What the API takes: null returns the workspace to the default. */
export const toLimit = (v: WorkspaceLimitValues): number | null => (v.mode === 'custom' ? Number(v.limit.trim()) : null);
