import type { GenerateReportValues } from '../schemas/generateReportSchema';
import type { ScheduleValues } from '../schemas/scheduleSchema';
import type { GenerateReportInput, ReportSchedule } from '../types';
import { monthOptions, monthRange } from './period';
import { ALL_SECTIONS } from './sections';
import { DEFAULT_SEND_HOUR } from './schedule';

/** Generate report: last month against the previous one, every section. */
export const GENERATE_DEFAULTS: GenerateReportValues = {
  period: 'last_month',
  month: monthOptions()[0].value,
  start: '',
  end: '',
  compare: 'previous',
  sections: ALL_SECTIONS,
  title: '',
  note: '',
  sendWhenReady: false,
  sendTo: [],
};

/** The form as the API takes it: empty extras left out. */
export function toGenerateInput(v: GenerateReportValues): GenerateReportInput {
  return {
    // A specific month is a custom range over that month.
    ...(v.period === 'month'
      ? { period: 'custom' as const, ...monthRange(v.month) }
      : { period: v.period, ...(v.period === 'custom' ? { start: v.start, end: v.end } : {}) }),
    compare: v.compare,
    sections: v.sections,
    ...(v.title.trim() ? { title: v.title.trim() } : {}),
    ...(v.note.trim() ? { note: v.note.trim() } : {}),
    ...(v.sendWhenReady && v.sendTo.length ? { sendTo: v.sendTo } : {}),
  };
}

/** A saved schedule in the form; a new one starts on, on the 1st, with every section. */
export const toScheduleForm = (s: ReportSchedule | null | undefined): ScheduleValues => ({
  isActive: s?.isActive ?? true,
  dayOfMonth: s?.dayOfMonth ?? 1,
  sendHour: s?.sendHour ?? DEFAULT_SEND_HOUR,
  recipients: s?.recipients ?? [],
  sections: s?.sections?.length ? s.sections : ALL_SECTIONS,
  compare: s?.compare ?? 'previous',
  note: s?.note ?? '',
});
