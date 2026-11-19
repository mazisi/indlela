import { describe, expect, it } from 'vitest';

import { SA_PHONE_REGEX, formatSaPhone, saPhoneDigits } from './saPhone';

describe('saPhoneDigits', () => {
  it('keeps a local number to 10 digits', () => {
    expect(saPhoneDigits('0110000000')).toBe('0110000000');
  });

  it('normalises a +27 international prefix to a leading 0', () => {
    expect(saPhoneDigits('+27 11 000 0000')).toBe('0110000000');
    expect(saPhoneDigits('27110000000')).toBe('0110000000');
  });

  it('normalises a 0027 international prefix', () => {
    expect(saPhoneDigits('0027110000000')).toBe('0110000000');
  });

  it('caps at 10 digits and strips non-digits', () => {
    expect(saPhoneDigits('011-000-0000-99')).toBe('0110000000');
  });

  it('handles null/undefined', () => {
    expect(saPhoneDigits(null)).toBe('');
    expect(saPhoneDigits(undefined)).toBe('');
  });
});

describe('formatSaPhone', () => {
  it('formats progressively as the user types', () => {
    expect(formatSaPhone('01')).toBe('01');
    expect(formatSaPhone('011')).toBe('011');
    expect(formatSaPhone('011000')).toBe('011 000');
    expect(formatSaPhone('0110000000')).toBe('011 000 0000');
  });

  it('formats a pasted +27 number to the local grouped form', () => {
    expect(formatSaPhone('+27110000000')).toBe('011 000 0000');
  });

  it('is idempotent on an already-formatted value', () => {
    expect(formatSaPhone('011 000 0000')).toBe('011 000 0000');
  });
});

describe('SA_PHONE_REGEX', () => {
  it('accepts a complete local number', () => {
    expect(SA_PHONE_REGEX.test('011 000 0000')).toBe(true);
    expect(SA_PHONE_REGEX.test('082 123 4567')).toBe(true);
  });

  it('rejects incomplete or international forms', () => {
    expect(SA_PHONE_REGEX.test('011 000')).toBe(false);
    expect(SA_PHONE_REGEX.test('0110000000')).toBe(false);
    expect(SA_PHONE_REGEX.test('+27 11 000 0000')).toBe(false);
  });
});
