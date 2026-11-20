import { z } from 'zod';

const businessSchema = z.object({
  title: z.string(),
  placeId: z.string().nullable(),
  cid: z.string().nullable(),
  address: z.string().nullable(),
  lat: z.number(),
  lng: z.number(),
});

/** One schema for create and edit: on edit the business is the grid's own (locked). */
export const gridSchema = z.object({
  keyword: z.string().trim().min(2, 'Enter at least 2 characters.').max(100, 'Keep it under 100 characters.'),
  business: businessSchema.nullable().refine((b) => b !== null, 'Search for the business and choose its listing.'),
  /** null until a business is chosen (the grid centres on it). */
  centerLat: z.number().min(-90).max(90).nullable().refine((v) => v !== null, 'Choose the centre of the grid.'),
  centerLng: z.number().min(-180).max(180).nullable().refine((v) => v !== null, 'Choose the centre of the grid.'),
  size: z.union([z.literal(3), z.literal(5), z.literal(7)], { error: 'Choose a grid size.' }),
  spacingKm: z.union([z.literal(0.5), z.literal(1), z.literal(2), z.literal(3), z.literal(5)], { error: 'Choose the spacing.' }),
  device: z.enum(['mobile', 'desktop'], { error: 'Choose a device.' }),
  schedule: z.enum(['none', 'weekly', 'monthly'], { error: 'Choose a schedule.' }),
  scanNow: z.boolean(),
  isActive: z.boolean(),
});

export type GridFormValues = z.input<typeof gridSchema>;
export type GridFormOutput = z.output<typeof gridSchema>;

export const businessSearchSchema = z.string().trim().min(2, 'Enter at least 2 characters of the business name.').max(100, 'Keep it under 100 characters.');
