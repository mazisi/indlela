import { useEffect, type FormEvent } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileText, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DateInput } from '@/components/ui/date-input';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/features/auth/components/FormField';
import { fieldAria } from '@/features/auth/lib/fieldAria';
import showToaster from '@/utils/showToaster';
import { handleApiValidationError } from '@/utils/formErrorHandler';
import { useGenerateReport } from '../../hooks/useReports';
import { rootFieldErrors } from '../../lib/errors';
import { monthOptions, toYmd } from '../../lib/period';
import { GENERATE_DEFAULTS, toGenerateInput } from '../../lib/forms';
import { generateReportSchema, MAX_NOTE, type GenerateReportValues } from '../../schemas/generateReportSchema';
import { CompareSelect } from '../form/CompareSelect';
import { PeriodChoice } from '../form/PeriodChoice';
import { RecipientsInput } from '../form/RecipientsInput';
import { SectionsChoice } from '../form/SectionsChoice';

interface Props {
  site: { id: number; name: string } | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** After the request is accepted (the report is generating). */
  onGenerated?: (reportId: number) => void;
}

/** Generate a report now: the period, what it is compared with, its sections, a title and a note, and who gets it by email when it's ready. */
export function GenerateReportSheet({ site, open, onOpenChange, onGenerated }: Props) {
  const generate = useGenerateReport(site?.id ?? 0);
  const form = useForm<GenerateReportValues>({ resolver: zodResolver(generateReportSchema), defaultValues: GENERATE_DEFAULTS });
  const { errors } = form.formState;
  const [period, sendWhenReady, note] = useWatch({ control: form.control, name: ['period', 'sendWhenReady', 'note'] });

  /** After "Email it when ready" is ticked: the recipients box renders on the next frame, then scrolls into view and takes the cursor. */
  const focusRecipients = () =>
    window.requestAnimationFrame(() => {
      const input = document.getElementById('gen-send-to');
      if (!input) return;
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      input.scrollIntoView?.({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
      input.focus({ preventScroll: true });
    });
  const today = toYmd(new Date());

  useEffect(() => {
    if (open) form.reset(GENERATE_DEFAULTS);
  }, [open, form]);

  const onValid = async (values: GenerateReportValues) => {
    if (!site) return;
    try {
      const row = await generate.mutateAsync(toGenerateInput(values));
      showToaster('success', values.sendWhenReady ? 'Generating the report. It will be emailed when it is ready.' : 'Generating the report. It will be ready in a moment.');
      onGenerated?.(row.id);
      onOpenChange(false);
    } catch (error) {
      handleApiValidationError(rootFieldErrors(error), form.setError, { send_to: 'sendTo' });
    }
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.stopPropagation();
    void form.handleSubmit(onValid)(e);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-xl">
        <SheetHeader className="border-b">
          <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Reports{site ? ` · ${site.name}` : ''}</p>
          <SheetTitle className="text-lg">Generate report</SheetTitle>
          <SheetDescription>A white-label report with your logo and a plain-language summary at the top. It takes a moment to build.</SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto p-4">
            <Controller control={form.control} name="period" render={({ field }) => <PeriodChoice idPrefix="gen-period" value={field.value} onChange={field.onChange} />} />

            {period === 'month' && (
              <FormField id="gen-month" label="Month" error={errors.month?.message} required hint="The whole calendar month, from the 1st to its last day.">
                <Controller
                  control={form.control}
                  name="month"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger {...fieldAria('gen-month', errors.month?.message, true)} aria-required className="w-full">
                        <SelectValue placeholder="Choose a month" />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {monthOptions().map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
            )}

            {period === 'custom' && (
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField id="gen-start" label="First day" error={errors.start?.message} required>
                  <Controller
                    control={form.control}
                    name="start"
                    render={({ field }) => <DateInput {...fieldAria('gen-start', errors.start?.message)} aria-required max={today} value={field.value} onChange={(e) => field.onChange(e.target.value)} onBlur={field.onBlur} />}
                  />
                </FormField>
                <FormField id="gen-end" label="Last day" error={errors.end?.message} required>
                  <Controller
                    control={form.control}
                    name="end"
                    render={({ field }) => <DateInput {...fieldAria('gen-end', errors.end?.message)} aria-required max={today} value={field.value} onChange={(e) => field.onChange(e.target.value)} onBlur={field.onBlur} />}
                  />
                </FormField>
              </div>
            )}

            <Controller control={form.control} name="compare" render={({ field }) => <CompareSelect id="gen-compare" value={field.value} onChange={field.onChange} error={errors.compare?.message} />} />

            <Controller control={form.control} name="sections" render={({ field }) => <SectionsChoice idPrefix="gen-sections" value={field.value} onChange={field.onChange} error={errors.sections?.message} />} />

            <FormField id="gen-title" label="Title (optional)" error={errors.title?.message} hint="Leave empty for “SEO report” with the period.">
              <Input {...fieldAria('gen-title', errors.title?.message, true)} autoComplete="off" placeholder="SEO report · October 2026" {...form.register('title')} />
            </FormField>

            <FormField
              id="gen-note"
              label="Note (optional)"
              error={errors.note?.message}
              hint="A personal message shown under the summary."
              aside={<span className="text-xs tabular-nums text-muted-foreground">{note.length} / {MAX_NOTE}</span>}
            >
              <Textarea {...fieldAria('gen-note', errors.note?.message, true)} rows={3} placeholder="Great month: the new service pages are already ranking. Next we tackle page speed." {...form.register('note')} />
            </FormField>

            <div className="space-y-3 rounded border bg-muted/30 p-3">
              <Controller
                control={form.control}
                name="sendWhenReady"
                render={({ field }) => (
                  <label htmlFor="gen-send" className="flex cursor-pointer items-start gap-3">
                    <Checkbox
                      id="gen-send"
                      checked={field.value}
                      onCheckedChange={(v) => {
                        field.onChange(v === true);
                        // Ticked by the user: bring the recipients into view and put the cursor there.
                        if (v === true) focusRecipients();
                      }}
                      className="mt-0.5"
                    />
                    <span>
                      <span className="block text-sm font-medium">Email it when ready</span>
                      <span className="block text-xs text-muted-foreground">Sent with a link to the report and the PDF attached, from your workspace's name.</span>
                    </span>
                  </label>
                )}
              />
              {sendWhenReady && (
                <Controller
                  control={form.control}
                  name="sendTo"
                  render={({ field }) => (
                    <RecipientsInput id="gen-send-to" label="Recipients" value={field.value} onChange={field.onChange} error={errors.sendTo?.message ?? errors.sendTo?.root?.message} required hint="Press Enter after each address." />
                  )}
                />
              )}
            </div>
          </div>

          <SheetFooter className="flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={generate.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={generate.isPending || !site}>
              {generate.isPending ? <Loader2 className="animate-spin" /> : <FileText />}
              Generate report
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
