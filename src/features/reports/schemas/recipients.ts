import { z } from 'zod';
import { MAX_RECIPIENTS } from '../lib/schedule';

export const emailSchema = z.email('Enter a valid email address.');

export const isEmail = (value: string) => emailSchema.safeParse(value).success;

/** 1–10 valid, distinct email addresses. */
export const recipientsSchema = z
  .array(emailSchema)
  .min(1, 'Add at least one email address.')
  .max(MAX_RECIPIENTS, `Add at most ${MAX_RECIPIENTS} email addresses.`);
