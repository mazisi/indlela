import { useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, RotateCcw } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { RichTextEditor, type RichTextEditorHandle } from '@/components/form/RichTextEditor';
import { FormAlert } from '@/features/auth/components/FormAlert';
import { FormField } from '@/features/auth/components/FormField';
import { fieldAria } from '@/features/auth/lib/fieldAria';
import showToaster from '@/utils/showToaster';
import { getApiErrorMessage, handleApiValidationError } from '@/utils/formErrorHandler';
import { useResetTemplate, useSaveTemplate } from '../hooks/useEmailTemplates';
import { templateSchema, type TemplateFormValues } from '../schemas/emailTemplateSchema';
import type { EmailTemplate, EmailTemplatesPage } from '../types';
import { EmailPreview } from './EmailPreview';

interface Props {
  template: EmailTemplate;
  page: EmailTemplatesPage;
  onOpenChange: (open: boolean) => void;
}

const valuesOf = (t: EmailTemplate): TemplateFormValues => ({ subject: t.subject, body: t.body });

/**
 * Edit an email's subject and message (ported from workforce-app's
 * notification drawer, without the recipients: every Indlela email goes to
 * the person concerned), with the placeholders and a live preview.
 */
export function TemplateSheet({ template: t, page, onOpenChange }: Props) {
  const save = useSaveTemplate();
  const reset = useResetTemplate();
  const [confirmReset, setConfirmReset] = useState(false);
  const editor = useRef<RichTextEditorHandle>(null);
  const form = useForm<TemplateFormValues>({ resolver: zodResolver(templateSchema), defaultValues: valuesOf(t) });
  const { errors } = form.formState;
  const [subject, body] = useWatch({ control: form.control, name: ['subject', 'body'] });
  const canEdit = page.can.update;

  const onSubmit = async (v: TemplateFormValues) => {
    try {
      await save.mutateAsync({ type: t.type, input: v });
      showToaster('success', `${t.label} saved.`);
      onOpenChange(false);
    } catch (error) {
      handleApiValidationError(error, form.setError);
    }
  };

  const restore = async () => {
    try {
      const fresh = await reset.mutateAsync(t.type);
      form.reset(valuesOf(fresh));
      showToaster('success', 'Back to the default wording.');
      setConfirmReset(false);
    } catch (error) {
      showToaster('error', getApiErrorMessage(error, 'Could not reset the email.'));
    }
  };

  return (
    <Sheet open onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-5xl">
        <SheetHeader className="border-b">
          <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Email template</p>
          <SheetTitle className="text-lg">{t.label}</SheetTitle>
          <SheetDescription>{t.description}</SheetDescription>
        </SheetHeader>
        <form
          noValidate
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(e) => {
            e.stopPropagation();
            void form.handleSubmit(onSubmit)(e);
          }}
        >
          <div className="relative grid min-h-0 flex-1 gap-4 overflow-y-auto p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
            <fieldset disabled={!canEdit} className="min-w-0 space-y-4">
              <FormAlert tone="info">
                {t.storesBody
                  ? `This email goes to ${(t.directRecipient ?? 'the person concerned').toLowerCase()}; only its wording can be changed.`
                  : `This email goes to ${(t.directRecipient ?? 'the person concerned').toLowerCase()} and carries a sign-in code or link, so only its wording can be changed and it is logged without its content.`}
              </FormAlert>

              <FormField id="et-subject" label="Subject" error={errors.subject?.message} required>
                <Input {...fieldAria('et-subject', errors.subject?.message)} aria-required {...form.register('subject')} />
              </FormField>

              <div className="space-y-1.5">
                <p className="flex items-center gap-0.5 text-sm font-medium" id="et-body-label">
                  Message
                  <span className="text-destructive" aria-hidden>
                    *
                  </span>
                </p>
                <Controller
                  control={form.control}
                  name="body"
                  render={({ field }) => (
                    <RichTextEditor
                      ref={editor}
                      id="et-body"
                      label="Message"
                      value={field.value}
                      onChange={field.onChange}
                      readOnly={!canEdit}
                      invalid={Boolean(errors.body)}
                      describedBy={errors.body ? 'et-body-error' : 'et-body-hint'}
                    />
                  )}
                />
                {errors.body && (
                  <p id="et-body-error" className="text-xs text-bad">
                    {errors.body.message}
                  </p>
                )}
              </div>

              <div id="et-body-hint" className="space-y-1.5 rounded border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Placeholders are filled in when the email is sent. Click one to add it to the message at the cursor.</p>
                <div className="flex flex-wrap gap-1.5">
                  {t.variables.map((v) => (
                    <button
                      key={v.key}
                      type="button"
                      title={v.description}
                      disabled={!canEdit}
                      onClick={() => editor.current?.insert(`{{${v.key}}}`)}
                      className="rounded border bg-background px-1.5 py-0.5 font-mono text-2xs text-primary transition-colors hover:border-primary/50 hover:bg-accent disabled:opacity-60"
                    >
                      {`{{${v.key}}}`}
                    </button>
                  ))}
                </div>
                {t.buttonText && <p className="text-xs text-muted-foreground">The &ldquo;{t.buttonText}&rdquo; button and its link are added below the message automatically.</p>}
              </div>
            </fieldset>

            <div className="min-w-0 lg:sticky lg:top-0 lg:max-h-[calc(100dvh-12rem)]">
              <EmailPreview type={t.type} subject={subject} body={body} buttonText={t.buttonText} from={`${page.mail.fromName} <${page.mail.fromAddress}>`} />
            </div>
          </div>

          <SheetFooter className="flex-row flex-wrap items-center gap-2 border-t">
            {canEdit && t.isCustomised && (
              <Button type="button" variant="ghost" className="mr-auto text-muted-foreground" onClick={() => setConfirmReset(true)} disabled={save.isPending}>
                <RotateCcw />
                Reset to default
              </Button>
            )}
            <Button type="button" variant="outline" className="ml-auto" onClick={() => onOpenChange(false)} disabled={save.isPending}>
              {canEdit ? 'Cancel' : 'Close'}
            </Button>
            {canEdit && (
              <Button type="submit" disabled={save.isPending}>
                {save.isPending && <Loader2 className="animate-spin" />}
                Save
              </Button>
            )}
          </SheetFooter>
        </form>
      </SheetContent>

      <ConfirmationDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Reset to default?"
        description={`The wording of “${t.label}” goes back to the built-in default.`}
        confirmLabel="Reset"
        isLoading={reset.isPending}
        onConfirm={() => void restore()}
      />
    </Sheet>
  );
}
