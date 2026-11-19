import { z } from 'zod';

// South African phone-number formatting + validation, shared by every phone
// field (client telephone, client contacts, user mobile, …). The client
// requires the local `011 000 0000` form — 10 digits starting with 0, grouped
// 3-3-4 — NOT the international `+27…` form.

/**
 * Reduce any input to SA local digits (10 max, leading 0). Normalises the
 * international prefix so a pasted `+27 11 000 0000` / `0027…` becomes
 * `0110000000`. Local numbers always start with a single 0, so a leading `27`
 * (11+ digits) is unambiguously an international prefix.
 */
export function saPhoneDigits(raw: string | null | undefined): string {
  let d = (raw ?? '').replace(/\D/g, '');
  if (d.startsWith('0027')) {
    d = '0' + d.slice(4);
  } else if (d.startsWith('27') && d.length >= 11) {
    d = '0' + d.slice(2);
  }
  return d.slice(0, 10);
}

/**
 * Format as the user types: `011 000 0000`. Idempotent — re-formatting an
 * already-formatted value (or hydrating a stored `+27…` value on edit) yields
 * the same local form.
 */
export function formatSaPhone(raw: string | null | undefined): string {
  const d = saPhoneDigits(raw);
  const parts = [d.slice(0, 3)];
  if (d.length > 3) parts.push(d.slice(3, 6));
  if (d.length > 6) parts.push(d.slice(6, 10));
  return parts.filter(Boolean).join(' ');
}

/** A complete SA number: exactly `0XX XXX XXXX`. */
export const SA_PHONE_REGEX = /^0\d{2} \d{3} \d{4}$/;

/** Human-facing validation message (shows the required shape). */
export const SA_PHONE_MESSAGE = 'Enter a valid number, e.g. 011 000 0000';

/**
 * Optional phone field — empty is allowed, but any value present must be a
 * complete SA number. Trims and returns `string | undefined` (empty → the
 * field is simply omitted upstream via `|| undefined`).
 */
export const saPhoneOptional = z
  .string()
  .trim()
  .optional()
  .or(z.literal(''))
  .refine((v) => !v || SA_PHONE_REGEX.test(v), SA_PHONE_MESSAGE);

/**
 * Always-present phone field that accepts an empty string — keeps the value
 * typed as `string` (never `undefined`) so array items map straight onto their
 * domain type (e.g. client contacts).
 */
export const saPhoneOrEmpty = z
  .string()
  .trim()
  .refine((v) => v === '' || SA_PHONE_REGEX.test(v), SA_PHONE_MESSAGE);
