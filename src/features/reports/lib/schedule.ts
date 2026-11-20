import type { ReportSchedule } from '../types';
import { formatLongDate } from './period';

export const MIN_DAY = 1;
export const MAX_DAY = 28;
export const MAX_RECIPIENTS = 10;
/** Hour of the day reports go out (South African time) when none is chosen. */
export const DEFAULT_SEND_HOUR = 8;
export const SEND_HOURS = Array.from({ length: 24 }, (_, h) => h);

/** 8 → "08:00". */
export const hourLabel = (hour: number) => `${String(hour).padStart(2, '0')}:00`;

const ordinal = (n: number) => {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) return `${n}th`;
  return `${n}${({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th'}`;
};

/** "Monthly on the 1st at 08:00 · 2 recipients", or "Off". */
export function scheduleLabel(schedule: (Pick<ReportSchedule, 'isActive' | 'dayOfMonth' | 'recipients'> & { sendHour?: number }) | null | undefined): string {
  if (!schedule?.isActive) return 'Off';
  const n = schedule.recipients.length;
  return `Monthly on the ${ordinal(schedule.dayOfMonth)} at ${hourLabel(schedule.sendHour ?? DEFAULT_SEND_HOUR)} · ${n} ${n === 1 ? 'recipient' : 'recipients'}`;
}

/**
 * When a monthly report on `day` at `hour` next goes out: this month if that
 * moment is still ahead, otherwise next month. (The API's next_run_at is the
 * source of truth once saved; this previews an unsaved choice.)
 */
export function nextRunDate(day: number, today = new Date(), hour = DEFAULT_SEND_HOUR): Date {
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), day, hour);
  return thisMonth > today ? thisMonth : new Date(today.getFullYear(), today.getMonth() + 1, day, hour);
}

/** "1 December 2026 at 08:00". */
export const nextRunLabel = (day: number, today = new Date(), hour = DEFAULT_SEND_HOUR) =>
  `${formatLongDate(nextRunDate(day, today, hour))} at ${hourLabel(hour)}`;

export { ordinal };
