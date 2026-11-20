import { describe, expect, it } from 'vitest';
import { formatCompact, formatNumber, formatPercent, formatPosition, pagePath, percentChange } from './format';

describe('Search Console number formatting', () => {
  it('formats counts with thousands separators', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(12.6)).toBe('13');
    expect(formatNumber(null)).toBe('—');
    expect(formatNumber(Number.NaN)).toBe('—');
  });

  it('compacts large numbers for chart axes', () => {
    expect(formatCompact(12345)).toBe('12.3k');
    expect(formatCompact(950)).toBe('950');
  });

  it('shows a 0–1 CTR as a percentage, with two decimals under 1 %', () => {
    expect(formatPercent(0.0345)).toBe('3.5%');
    expect(formatPercent(0.0042)).toBe('0.42%');
    expect(formatPercent(0)).toBe('0.0%');
    expect(formatPercent(1)).toBe('100.0%');
    expect(formatPercent(undefined)).toBe('—');
  });

  it('shows position to one decimal', () => {
    expect(formatPosition(7.456)).toBe('7.5');
    expect(formatPosition(12)).toBe('12.0');
    expect(formatPosition(0)).toBe('—');
  });

  it('works out a relative change, null when there is no base', () => {
    expect(percentChange(150, 100)).toBe(50);
    expect(percentChange(50, 100)).toBe(-50);
    expect(percentChange(0, 0)).toBe(0);
    expect(percentChange(10, 0)).toBeNull();
    expect(percentChange(10, null)).toBeNull();
  });

  it('shortens a page URL to its path', () => {
    expect(pagePath('https://www.karoo.co.za/blog/coffee?ref=1')).toBe('/blog/coffee?ref=1');
    expect(pagePath('https://www.karoo.co.za/')).toBe('/');
    expect(pagePath('not a url')).toBe('not a url');
  });
});
