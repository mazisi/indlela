import { z } from 'zod';

/**
 * A website address as typed: "example.co.za", "www.example.co.za/shop" or a
 * full URL. The API normalises it and keeps one site per domain.
 */
const looksLikeAddress = (v: string) => {
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(v) ? v : `https://${v}`);
    return ['http:', 'https:'].includes(url.protocol) && /^[^.\s]+(\.[^.\s]+)+$/.test(url.hostname);
  } catch {
    return false;
  }
};

/** Add or edit a site; matches the API's SiteRequest. The name defaults to the domain there. */
export const siteFormSchema = z.object({
  clientId: z.number({ error: 'Choose the client.' }).int().positive('Choose the client.'),
  url: z
    .string()
    .trim()
    .min(1, 'Enter the website address, e.g. www.example.co.za.')
    .max(2048)
    .refine(looksLikeAddress, 'Enter the website address, e.g. www.example.co.za.'),
  name: z
    .string()
    .trim()
    .max(120, 'At most 120 characters.')
    .transform((v) => v || null),
  isActive: z.boolean(),
});

export type SiteFormInput = z.input<typeof siteFormSchema>;
export type SiteFormValues = z.output<typeof siteFormSchema>;
