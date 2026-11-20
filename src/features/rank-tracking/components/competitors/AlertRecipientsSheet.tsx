import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { RecipientsInput } from '@/features/reports/components/form/RecipientsInput';
import showToaster from '@/utils/showToaster';
import { handleApiValidationError } from '@/utils/formErrorHandler';
import { useUpdateCompetitorSettings } from '../../hooks/useCompetitors';
import { alertRecipientsSchema, type AlertRecipientsValues } from '../../schemas/competitorSchema';

interface Props {
  siteId: number;
  recipients: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Who gets the daily overtake-alert email for this site; none means no emails (alerts still list here). */
export function AlertRecipientsSheet({ siteId, recipients, open, onOpenChange }: Props) {
  const save = useUpdateCompetitorSettings(siteId);
  const form = useForm<AlertRecipientsValues>({ resolver: zodResolver(alertRecipientsSchema), defaultValues: { alertRecipients: recipients } });
  const { errors } = form.formState;

  useEffect(() => {
    if (open) form.reset({ alertRecipients: recipients });
  }, [open, recipients, form]);

  const onSubmit = async (values: AlertRecipientsValues) => {
    try {
      await save.mutateAsync(values);
      showToaster('success', values.alertRecipients.length ? 'Alert emails saved.' : 'Alert emails are off for this site.');
      onOpenChange(false);
    } catch (error) {
      handleApiValidationError(error, form.setError);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg">
        <SheetHeader className="border-b">
          <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Competitor alerts</p>
          <SheetTitle className="text-lg">Alert emails</SheetTitle>
          <SheetDescription>When a competitor overtakes this site on a key keyword, these people get one summary email the next morning.</SheetDescription>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto p-4">
            <Controller
              control={form.control}
              name="alertRecipients"
              render={({ field }) => (
                <RecipientsInput
                  id="alert-recipients"
                  label="Recipients"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.alertRecipients?.message ?? errors.alertRecipients?.root?.message}
                  hint="Your team, usually the account manager. Press Enter after each address; leave empty for no emails."
                />
              )}
            />
          </div>

          <SheetFooter className="flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={save.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending && <Loader2 className="animate-spin" />}
              Save
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
