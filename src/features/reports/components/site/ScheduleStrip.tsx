import { CalendarClock, CalendarOff, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatLongDate } from '../../lib/period';
import { DEFAULT_SEND_HOUR, hourLabel, nextRunLabel, scheduleLabel } from '../../lib/schedule';
import { sectionLabel } from '../../lib/sections';
import type { ReportSchedule } from '../../types';

interface Props {
  schedule: ReportSchedule | null;
  canEdit: boolean;
  onEdit: () => void;
  /** "Send now": last month's report to the schedule's recipients, without waiting for its day. */
  onSendNow: () => void;
}

/** The site's monthly report at a glance, above its reports. */
export function ScheduleStrip({ schedule, canEdit, onEdit, onSendNow }: Props) {
  const on = Boolean(schedule?.isActive);
  const Icon = on ? CalendarClock : CalendarOff;
  return (
    <section aria-label="Monthly report" className="flex flex-wrap items-center gap-3 rounded border bg-card px-4 py-3 shadow-xs">
      <span className={on ? 'grid size-8 place-items-center rounded bg-accent text-primary' : 'grid size-8 place-items-center rounded bg-muted text-muted-foreground'} aria-hidden>
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold">Monthly report: {scheduleLabel(schedule)}</p>
        <p className="truncate text-xs text-muted-foreground">
          {schedule && on
            ? `Next report: ${schedule.nextRunOn ? `${formatLongDate(schedule.nextRunOn)} at ${hourLabel(schedule.sendHour ?? DEFAULT_SEND_HOUR)}` : nextRunLabel(schedule.dayOfMonth, undefined, schedule.sendHour)} · ${schedule.sections.map(sectionLabel).join(', ')} · to ${schedule.recipients.join(', ')}`
            : 'No report is generated or emailed automatically for this site.'}
        </p>
      </div>
      {canEdit && (
        <div className="flex shrink-0 items-center gap-2">
          {schedule && schedule.recipients.length > 0 && (
            <Button size="sm" onClick={onSendNow}>
              <Send className="size-3.5" aria-hidden />
              Send now
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onEdit}>
            {on ? 'Change' : 'Set up'}
          </Button>
        </div>
      )}
    </section>
  );
}
