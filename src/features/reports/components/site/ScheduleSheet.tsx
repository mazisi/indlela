import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarClock, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { SwitchRow } from '@/components/form/SwitchRow';
import { FormAlert } from '@/features/auth/components/FormAlert';
import { FormField } from '@/features/auth/components/FormField';
import { fieldAria } from '@/features/auth/lib/fieldAria';
import showToaster from '@/utils/showToaster';
import { getApiErrorMessage, handleApiValidationError } from '@/utils/formErrorHandler';
import { useReportSchedule, useSaveSchedule } from '../../hooks/useReports';
import { rootFieldErrors } from '../../lib/errors';
import { formatLongDate } from '../../lib/period';
import { MAX_DAY, MIN_DAY, SEND_HOURS, hourLabel, nextRunLabel, ordinal } from '../../lib/schedule';
import { toScheduleForm } from '../../lib/forms';
import { MAX_NOTE } from '../../schemas/generateReportSchema';
import { scheduleSchema, type ScheduleValues } from '../../schemas/scheduleSchema';
import { CompareSelect } from '../form/CompareSelect';
import { RecipientsInput } from '../form/RecipientsInput';
import { SectionsChoice } from '../form/SectionsChoice';

const DAYS = Array.from({ length: MAX_DAY - MIN_DAY + 1 }, (_, i) => MIN_DAY + i);

interface Props {
  site: { id: number; name: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * The site's monthly report: on or off, the day it goes out (1–28, so every
 * month has it), who gets it, its sections, comparison and note, with the
 * date of the next one.
 */
export function ScheduleSheet({ site, open, onOpenChange }: Props) {
  const schedule = useReportSchedule(site.id, open);
  const save = useSaveSchedule(site.id);
  const form = useForm<ScheduleValues>({ resolver: zodResolver(scheduleSchema), defaultValues: toScheduleForm(null) });
  const { errors } = form.formState;
  const [isActive, day, hour, note] = useWatch({ control: form.control, name: ['isActive', 'dayOfMonth', 'sendHour', 'note'] });

  useEffect(() => {
    if (open && schedule.isSuccess) form.reset(toScheduleForm(schedule.data));
  }, [open, schedule.isSuccess, schedule.data, form]);

  const onValid = async (v: ScheduleValues) => {
    try {
      await save.mutateAsync({ isActive: v.isActive, dayOfMonth: v.dayOfMonth, sendHour: v.sendHour, recipients: v.recipients, sections: v.sections, compare: v.compare, note: v.note.trim() || null });
      showToaster('success', v.isActive ? `Monthly report scheduled. The next one goes out on ${nextRunLabel(v.dayOfMonth, undefined, v.sendHour)}.` : 'Monthly report turned off.');
      onOpenChange(false);
    } catch (error) {
      handleApiValidationError(rootFieldErrors(error), form.setError);
    }
  };

  const saved = schedule.data;
  const savedNext = saved?.isActive && saved.dayOfMonth === day && saved.sendHour === hour && saved.nextRunOn ? `${formatLongDate(saved.nextRunOn)} at ${hourLabel(hour)}` : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-xl">
        <SheetHeader className="border-b">
          <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Reports · {site.name}</p>
          <SheetTitle className="text-lg">Monthly report</SheetTitle>
          <SheetDescription>A report on the previous month, generated and emailed to your client automatically.</SheetDescription>
        </SheetHeader>

        {schedule.isPending ? (
          <div className="space-y-5 p-4" aria-busy aria-label="Loading the schedule">
            <Skeleton className="h-16 w-full rounded" />
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-28 rounded" />
              <Skeleton className="h-9 w-full rounded" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-24 rounded" />
              <Skeleton className="h-9 w-full rounded" />
            </div>
          </div>
        ) : schedule.isError ? (
          <div className="p-4">
            <FormAlert tone="error">
              <p>{getApiErrorMessage(schedule.error, 'We could not load the schedule.')}</p>
              <p>
                <button type="button" className="font-medium underline" onClick={() => schedule.refetch()}>
                  Try again
                </button>
              </p>
            </FormAlert>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.stopPropagation();
              void form.handleSubmit(onValid)(e);
            }}
            noValidate
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="flex-1 space-y-5 overflow-y-auto p-4">
              <SwitchRow label="Send a report every month" hint="Off: no reports are generated or emailed. The settings below are kept for when you turn it back on.">
                {({ id, hintId }) => (
                  <Controller control={form.control} name="isActive" render={({ field }) => <Switch id={id} aria-describedby={hintId} checked={field.value} onCheckedChange={field.onChange} />} />
                )}
              </SwitchRow>

              <FormField id="sch-day" label="Day of the month" error={errors.dayOfMonth?.message} required hint="Up to the 28th, so every month has it. Covers the previous calendar month.">
                <Controller
                  control={form.control}
                  name="dayOfMonth"
                  render={({ field }) => (
                    <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                      <SelectTrigger {...fieldAria('sch-day', errors.dayOfMonth?.message, true)} aria-required className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {DAYS.map((d) => (
                          <SelectItem key={d} value={String(d)}>
                            The {ordinal(d)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>

              <FormField id="sch-hour" label="Time" error={errors.sendHour?.message} required hint="South African time. The report is generated then and arrives a few minutes later.">
                <Controller
                  control={form.control}
                  name="sendHour"
                  render={({ field }) => (
                    <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                      <SelectTrigger {...fieldAria('sch-hour', errors.sendHour?.message, true)} aria-required className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {SEND_HOURS.map((h) => (
                          <SelectItem key={h} value={String(h)}>
                            {hourLabel(h)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>

              {isActive && (
                <p className="flex items-center gap-2 rounded border border-primary/20 bg-accent/50 px-3 py-2 text-sm" data-testid="next-run" aria-live="polite">
                  <CalendarClock className="size-4 shrink-0 text-primary" aria-hidden />
                  <span>
                    Next report: <span className="font-semibold">{savedNext ?? nextRunLabel(day, undefined, hour)}</span>
                  </span>
                </p>
              )}

              <Controller
                control={form.control}
                name="recipients"
                render={({ field }) => (
                  <RecipientsInput
                    id="sch-recipients"
                    label="Recipients"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.recipients?.message ?? errors.recipients?.root?.message}
                    required
                    hint="Your client's contacts. Press Enter after each address."
                  />
                )}
              />

              <Controller control={form.control} name="sections" render={({ field }) => <SectionsChoice idPrefix="sch-sections" value={field.value} onChange={field.onChange} error={errors.sections?.message} />} />

              <Controller control={form.control} name="compare" render={({ field }) => <CompareSelect id="sch-compare" value={field.value} onChange={field.onChange} error={errors.compare?.message} />} />

              <FormField
                id="sch-note"
                label="Note (optional)"
                error={errors.note?.message}
                hint="Shown under the summary on every monthly report."
                aside={<span className="text-xs tabular-nums text-muted-foreground">{note.length} / {MAX_NOTE}</span>}
              >
                <Textarea {...fieldAria('sch-note', errors.note?.message, true)} rows={3} {...form.register('note')} />
              </FormField>
            </div>

            <SheetFooter className="flex-row justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={save.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending && <Loader2 className="animate-spin" />}
                Save schedule
              </Button>
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
