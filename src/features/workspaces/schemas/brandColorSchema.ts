import { z } from 'zod';

/** "#1f4e79" or "1f4e79"; empty = the default colour. */
export const brandColorSchema = z.object({
  brandColor: z
    .string()
    .trim()
    .refine((v) => v === '' || /^#?[0-9a-f]{6}$/i.test(v), 'Use a hex colour with six digits, e.g. #1f4e79.'),
});

export type BrandColorValues = z.infer<typeof brandColorSchema>;

/** The value the API stores: "#rrggbb" in lower case, or null for the default. */
export const toBrandColor = (v: string): string | null => {
  const t = v.trim().toLowerCase();
  return t === '' ? null : t.startsWith('#') ? t : `#${t}`;
};
