import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/features/auth/components/FormField';
import { fieldAria } from '@/features/auth/lib/fieldAria';
import { handleApiValidationError } from '@/utils/formErrorHandler';

const schema = z.object({ reason: z.string().trim().min(5, 'Give the reason.').max(500, 'At most 500 characters.') });
type Values = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** e.g. "Delete". */
  eyebrow: string;
  /** e.g. "H-2026-001 · Thandi Mokoena" or "3 hearings". */
  title: string;
  /** What happens, under the title. */
  note: string;
  /** e.g. "Why is it deleted?". */
  label: string;
  placeholder?: string;
  submitLabel: string;
  /** Saves with the reason; a 422 binds to the field, anything else is thrown to the caller's toast. */
  onSubmit: (reason: string) => Promise<void>;
  destructive?: boolean;
}

/** A drawer that asks why before an action that keeps a reason (delete, cancel, withdraw). */
export function ReasonSheet({ open, onOpenChange, eyebrow, title, note, label, placeholder, submitLabel, onSubmit, destructive = true }: Props) {
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { reason: '' } });
  const { errors, isSubmitting } = form.formState;

  const submit = async ({ reason }: Values) => {
    try {
      await onSubmit(reason);
    } catch (error) {
      handleApiValidationError(error, form.setError);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">{eyebrow}</p>
          <SheetTitle className="text-lg">{title}</SheetTitle>
          <SheetDescription>{note}</SheetDescription>
        </SheetHeader>
        <form
          onSubmit={(e) => {
            e.stopPropagation();
            void form.handleSubmit(submit)(e);
          }}
          noValidate
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="relative flex-1 space-y-4 overflow-y-auto p-4">
            <FormField id="rs-reason" label={label} error={errors.reason?.message} hint="Kept in the change history." required>
              <Textarea {...fieldAria('rs-reason', errors.reason?.message, true)} aria-required rows={3} autoFocus placeholder={placeholder} {...form.register('reason')} />
            </FormField>
          </div>
          <SheetFooter className="flex-row justify-end gap-2 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant={destructive ? 'destructive' : 'default'} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              {submitLabel}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
