import { describe, expect, it } from 'vitest';
import { accentOnWhite, brandTheme, contrastRatio, DEFAULT_BRAND_COLOR, inkOn, INK_DARK, INK_LIGHT } from './brand';
import { filenameFrom } from './download';
import { toGenerateInput, GENERATE_DEFAULTS } from './forms';
import { describeRange, monthOptions, monthRange, resolvePeriod } from './period';
import { nextRunDate, nextRunLabel, scheduleLabel } from './schedule';
import { generateReportSchema } from '../schemas/generateReportSchema';
import { scheduleSchema } from '../schemas/scheduleSchema';

describe('brand colour', () => {
  it('puts white text on dark colours and dark text on light ones', () => {
    expect(inkOn('#0b6e4f')).toBe(INK_LIGHT);
    expect(inkOn('#1d5c86')).toBe(INK_LIGHT);
    expect(inkOn('#ffd400')).toBe(INK_DARK);
    expect(inkOn('#f2f2f2')).toBe(INK_DARK);
  });

  it('darkens a pale colour until it reads on white (3:1), and leaves a dark one alone', () => {
    expect(accentOnWhite('#0b6e4f')).toBe('#0b6e4f');
    const yellow = accentOnWhite('#ffd400');
    expect(yellow).not.toBe('#ffd400');
    expect(contrastRatio(yellow, '#ffffff')).toBeGreaterThanOrEqual(3);
  });

  it('falls back to the default for a missing or invalid colour', () => {
    expect(brandTheme(null).brand).toBe(DEFAULT_BRAND_COLOR);
    expect(brandTheme('red').brand).toBe(DEFAULT_BRAND_COLOR);
    expect(brandTheme('#ABCDEF').brand).toBe('#abcdef');
  });
});

describe('schedule', () => {
  const nov20 = new Date(2026, 10, 20);
  it('labels a schedule', () => {
    expect(scheduleLabel(null)).toBe('Off');
    expect(scheduleLabel({ isActive: false, dayOfMonth: 1, recipients: ['a@b.co'] })).toBe('Off');
    expect(scheduleLabel({ isActive: true, dayOfMonth: 1, recipients: ['a@b.co', 'c@d.co'] })).toBe('Monthly on the 1st at 08:00 · 2 recipients');
    expect(scheduleLabel({ isActive: true, dayOfMonth: 22, recipients: ['a@b.co'] })).toBe('Monthly on the 22nd at 08:00 · 1 recipient');
    expect(scheduleLabel({ isActive: true, dayOfMonth: 13, sendHour: 17, recipients: ['a@b.co'] })).toBe('Monthly on the 13th at 17:00 · 1 recipient');
  });

  it('finds the next run: later this month, or next month when the day has passed', () => {
    expect(nextRunLabel(1, nov20)).toBe('1 December 2026 at 08:00');
    expect(nextRunLabel(28, nov20)).toBe('28 November 2026 at 08:00');
    expect(nextRunDate(5, new Date(2026, 11, 10))).toEqual(new Date(2027, 0, 5, 8));
    // Today: still ahead if the hour hasn't come, else next month.
    expect(nextRunLabel(20, new Date(2026, 10, 20, 7, 30))).toBe('20 November 2026 at 08:00');
    expect(nextRunLabel(20, new Date(2026, 10, 20, 9, 0))).toBe('20 December 2026 at 08:00');
    expect(nextRunLabel(20, new Date(2026, 10, 20, 9, 0), 17)).toBe('20 November 2026 at 17:00');
  });
});

describe('periods', () => {
  const nov20 = new Date(2026, 10, 20);
  it('resolves the preset periods', () => {
    const last = resolvePeriod('last_month', nov20);
    expect(describeRange(last.start, last.end)).toBe('October 2026');
    const three = resolvePeriod('last_3_months', nov20);
    expect(describeRange(three.start, three.end)).toBe('August – October 2026');
    const now = resolvePeriod('this_month', nov20);
    expect(describeRange(now.start, now.end)).toBe('1 – 19 November 2026');
  });

  it('offers the last 16 whole months and turns one into its first and last day', () => {
    const months = monthOptions(nov20);
    expect(months).toHaveLength(16);
    expect(months[0]).toEqual({ value: '2026-10', label: 'October 2026' });
    expect(months[15]).toEqual({ value: '2025-07', label: 'July 2025' });
    expect(monthRange('2026-10')).toEqual({ start: '2026-10-01', end: '2026-10-31' });
    expect(monthRange('2024-02')).toEqual({ start: '2024-02-01', end: '2024-02-29' });
    expect(toGenerateInput({ ...GENERATE_DEFAULTS, period: 'month', month: '2026-09' })).toMatchObject({ period: 'custom', start: '2026-09-01', end: '2026-09-30' });
  });
});

describe('filenameFrom', () => {
  it('reads plain and RFC 5987 filenames', () => {
    expect(filenameFrom('attachment; filename="karoo-october-2026.pdf"', 'x.pdf')).toBe('karoo-october-2026.pdf');
    expect(filenameFrom("attachment; filename*=UTF-8''r%C3%A9sum%C3%A9.pdf", 'x.pdf')).toBe('résumé.pdf');
    expect(filenameFrom(undefined, 'x.pdf')).toBe('x.pdf');
  });
});

describe('schemas', () => {
  it('needs at least one section, and both days of a custom range in order', () => {
    const base = { ...GENERATE_DEFAULTS };
    expect(generateReportSchema.safeParse({ ...base, sections: [] }).success).toBe(false);
    const custom = generateReportSchema.safeParse({ ...base, period: 'custom', start: '2026-10-10', end: '2026-10-01' });
    expect(custom.success).toBe(false);
    expect(custom.error?.issues[0].message).toBe('The last day must be on or after the first.');
    expect(generateReportSchema.safeParse({ ...base, period: 'custom', start: '2026-10-01', end: '2026-10-10' }).success).toBe(true);
    expect(generateReportSchema.safeParse({ ...base, sendWhenReady: true, sendTo: [] }).success).toBe(false);
  });

  it('sends only what was chosen', () => {
    expect(toGenerateInput({ ...GENERATE_DEFAULTS, title: '  ', sendTo: ['a@b.co'] })).toEqual({ period: 'last_month', compare: 'previous', sections: ['search_console', 'rank_tracking', 'site_audit'] });
    expect(toGenerateInput({ ...GENERATE_DEFAULTS, period: 'custom', start: '2026-10-01', end: '2026-10-10', sendWhenReady: true, sendTo: ['a@b.co'] })).toMatchObject({
      start: '2026-10-01',
      end: '2026-10-10',
      sendTo: ['a@b.co'],
    });
  });

  it('needs 1–10 recipients and a day from 1 to 28', () => {
    const v = { isActive: true, dayOfMonth: 1, sendHour: 8, recipients: ['a@b.co'], sections: ['site_audit'] as const, compare: 'previous' as const, note: '' };
    expect(scheduleSchema.safeParse(v).success).toBe(true);
    expect(scheduleSchema.safeParse({ ...v, recipients: [] }).success).toBe(false);
    // As the API: recipients are needed even while off.
    expect(scheduleSchema.safeParse({ ...v, isActive: false, recipients: [] }).success).toBe(false);
    expect(scheduleSchema.safeParse({ ...v, recipients: Array.from({ length: 11 }, (_, i) => `p${i}@b.co`) }).success).toBe(false);
    expect(scheduleSchema.safeParse({ ...v, dayOfMonth: 29 }).success).toBe(false);
    expect(scheduleSchema.safeParse({ ...v, sendHour: 24 }).success).toBe(false);
  });
});
