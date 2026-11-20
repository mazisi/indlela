import type { Bucket, Device, Distribution, Frequency } from '../types';

/** A position as shown: "—" when not in the top 100 (or not checked yet). */
export const formatRank = (position: number | null | undefined): string =>
  typeof position === 'number' && Number.isFinite(position) && position > 0 ? String(Math.round(position)) : '—';

export const BUCKETS: { value: Bucket; label: string }[] = [
  { value: 'top3', label: 'Top 3' },
  { value: 'top10', label: 'Top 10' },
  { value: 'top100', label: 'Top 100' },
  { value: 'not_ranking', label: 'Not ranking' },
];

export const isBucket = (v: string | null): v is Bucket => BUCKETS.some((b) => b.value === v);
export const isDevice = (v: string | null): v is Device => v === 'desktop' || v === 'mobile';

export const DEVICE_LABEL: Record<Device, string> = { desktop: 'Desktop', mobile: 'Mobile' };
export const FREQUENCY_LABEL: Record<Frequency, string> = { daily: 'Daily', weekly: 'Weekly' };

/** The API's days of the week (0 = Sunday … 6 = Saturday), listed Monday first. */
export const WEEKDAYS: { value: number; label: string }[] = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
];
export const weekdayName = (day: number | null | undefined) => WEEKDAYS.find((d) => d.value === day)?.label;

export const frequencyLabel = (frequency: Frequency, weeklyDay: number | null | undefined) => {
  const day = frequency === 'weekly' ? weekdayName(weeklyDay) : undefined;
  return day ? `Weekly · ${day}s` : FREQUENCY_LABEL[frequency];
};

/** The distribution's buckets are exclusive (4–10 in top10 …); the tiles count "in the top 10" as 1–10. */
export const inTop10 = (d: Distribution) => d.top3 + d.top10;

export const DISTRIBUTION_SEGMENTS: { key: keyof Distribution; label: string; range: string }[] = [
  { key: 'top3', label: 'Top 3', range: '1–3' },
  { key: 'top10', label: '4–10', range: '4–10' },
  { key: 'top20', label: '11–20', range: '11–20' },
  { key: 'top100', label: '21–100', range: '21–100' },
  { key: 'notRanking', label: 'Not ranking', range: 'not in the top 100' },
];
