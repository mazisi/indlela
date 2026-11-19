import { describe, expect, it } from 'vitest';
import { formatDate } from './formatDate';

describe('formatDate', () => {
  it('uses dd/mm/yyyy', () => {
    expect(formatDate('2026-09-01T10:00:00')).toBe('01/09/2026');
  });

  it('shows a dash for garbage', () => {
    expect(formatDate('not a date')).toBe('—');
  });
});
