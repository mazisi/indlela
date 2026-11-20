import { z } from 'zod';
import { parseCoordinate } from '../lib/coordinates';
import { MAX_KEYWORDS, MAX_KEYWORD_LENGTH, MAX_TAGS, MAX_TAG_LENGTH, parseKeywords, parseTags } from '../lib/keywords';

export const MAX_LOCATIONS = 5;

/** The location code for South Africa: the usual market, so the default. */
export const DEFAULT_LOCATION = { type: 'code' as const, code: 2710, name: 'South Africa' };

const locationSchema = z.object({
  type: z.enum(['code', 'coordinate']),
  code: z.number().optional(),
  coordinate: z.string().optional(),
  name: z.string().min(1),
});

/** Tags typed as "a, b": at most 10, each up to 30 characters (as the API allows). */
export function refineTags(text: string, ctx: z.RefinementCtx) {
  const tags = parseTags(text);
  if (tags.length > MAX_TAGS) ctx.addIssue({ code: 'custom', message: `Use at most ${MAX_TAGS} tags.` });
  const long = tags.find((t) => t.length > MAX_TAG_LENGTH);
  if (long) ctx.addIssue({ code: 'custom', message: `Keep each tag under ${MAX_TAG_LENGTH} characters (“${long.slice(0, 20)}…”).` });
}

export const addKeywordsSchema = z.object({
  keywordsText: z.string().superRefine((text, ctx) => {
    const { keywords } = parseKeywords(text);
    if (keywords.length === 0) ctx.addIssue({ code: 'custom', message: 'Enter at least one keyword, one per line.' });
    else if (keywords.length > MAX_KEYWORDS) ctx.addIssue({ code: 'custom', message: `Add at most ${MAX_KEYWORDS} keywords at a time.` });
    else {
      const long = keywords.find((k) => k.length > MAX_KEYWORD_LENGTH);
      if (long) ctx.addIssue({ code: 'custom', message: `Keep each keyword under ${MAX_KEYWORD_LENGTH} characters (“${long.slice(0, 30)}…”).` });
    }
  }),
  locations: z.array(locationSchema).min(1, 'Choose at least one location.').max(MAX_LOCATIONS, `Choose at most ${MAX_LOCATIONS} locations.`),
  devices: z.array(z.enum(['desktop', 'mobile'])).min(1, 'Choose desktop, mobile or both.'),
  frequency: z.enum(['daily', 'weekly'], { error: 'Choose how often to check.' }),
  tagsText: z.string().superRefine(refineTags),
});

export type AddKeywordsValues = z.infer<typeof addKeywordsSchema>;

/** "Add a suburb by coordinates": a name and "lat,lng". */
export const coordinateLocationSchema = z.object({
  name: z.string().trim().min(1, 'Name the place, e.g. Sandton.').max(100, 'Keep the name under 100 characters.'),
  coordinate: z
    .string()
    .trim()
    .min(1, 'Enter the latitude and longitude, e.g. -26.1076, 28.0567.')
    .refine((v) => parseCoordinate(v) !== null, 'Use “latitude, longitude” in decimal degrees, e.g. -26.1076, 28.0567.'),
});

export type CoordinateLocationValues = z.infer<typeof coordinateLocationSchema>;
