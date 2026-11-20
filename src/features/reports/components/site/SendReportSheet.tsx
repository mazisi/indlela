import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Send } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/features/auth/components/FormField';
import { fieldAria } from '@/features/auth/lib/fieldAria';
import showToaster from '@/utils/showToaster';
import { getApiErrorMessage, handleApiValidationError } from '@/utils/formErrorHandler';
import { useSendReport } from '../../hooks/useReports';
import { errorType, rootFieldErrors } from '../../lib/errors';
import { sendReportSchema, type SendReportValues } from '../../schemas/sendReportSchema';
import type { ReportRow } from '../../types';
import { RecipientsInput } from '../form/RecipientsInput';

interface Props {
  siteId: number;
  /** The report to send; undefined closes the drawer. */
  report: ReportRow | undefined;
  /** Suggested recipients, e.g. the monthly schedule's. */
  suggested?: string[];
  onClose: () => void;
}

/** Email a ready report (a link to it and the PDF) to up to 10 people, with an optional message. */
export function SendReportSheet({ siteId, report, suggested, onClose }: Props) {
  const send = useSendReport(siteId);
  const form = useForm<SendReportValues>({ resolver: zodResolver(sendReportSchema), defaultValues: { recipients: [], message: '' } });
  const { errors } = form.formState;

  useEffect(() => {
    if (report) form.reset({ recipients: report.sentTo?.length ? report.sentTo : (suggested ?? []), message: '' });
  }, [report, suggested, form]);

  const onValid = async (v: SendReportValues) => {
    if (!report) return;
    try {
      await send.mutateAsync({ id: report.id, input: { recipients: v.recipients, ...(v.message.trim() ? { message: v.message.trim() } : {}) } });
      showToaster('success', `Report sent to ${v.recipients.length} ${v.recipients.length === 1 ? 'person' : 'people'}.`);
      onClose();
    } catch (error) {
      const res = errorType(error);
      if (res?.status === 409) {
        showToaster('error', getApiErrorMessage(error, "The report isn't ready yet. Try again in a moment."));
        return;
      }
      handleApiValidationError(rootFieldErrors(error), form.setError);
    }
  };

  return (
    <Sheet open={Boolean(report)} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg">
        <SheetHeader className="border-b">
          <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Send report</p>
          <SheetTitle className="text-lg">{report?.title}</SheetTitle>
          <SheetDescription>{report ? `${report.periodLabel}. ` : ''}Each recipient gets a link to the report and the PDF, from your workspace's name.</SheetDescription>
        </SheetHeader>

        <form
          onSubmit={(e) => {
            e.stopPropagation();
            void form.handleSubmit(onValid)(e);
          }}
          noValidate
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 space-y-5 overflow-y-auto p-4">
            <Controller
              control={form.control}
              name="recipients"
              render={({ field }) => (
                <RecipientsInput id="send-recipients" label="Recipients" value={field.value} onChange={field.onChange} error={errors.recipients?.message ?? errors.recipients?.root?.message} required hint="Press Enter after each address." />
              )}
            />
            <FormField id="send-message" label="Message (optional)" error={errors.message?.message} hint="Added to the email above the link.">
              <Textarea {...fieldAria('send-message', errors.message?.message, true)} rows={4} placeholder="Hi Thandi, here is October's report. Shout if anything is unclear." {...form.register('message')} />
            </FormField>
          </div>

          <SheetFooter className="flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={send.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={send.isPending}>
              {send.isPending ? <Loader2 className="animate-spin" /> : <Send />}
              Send report
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
