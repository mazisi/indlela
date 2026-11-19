import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { SwitchRow } from '@/components/form/SwitchRow';
import { FormField } from '@/features/auth/components/FormField';
import { fieldAria } from '@/features/auth/lib/fieldAria';
import showToaster from '@/utils/showToaster';
import { handleApiValidationError } from '@/utils/formErrorHandler';
import { clientFormSchema, type ClientFormInput, type ClientFormValues } from '../schemas/clientSchema';
import { useSaveClient } from '../hooks/useClients';
import type { Client } from '../types';

interface ClientFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The client to edit; omit to add one. */
  client?: Client;
}

const EMPTY: ClientFormInput = { name: '', contactName: '', contactEmail: '', notes: '', isActive: true };

const toForm = (c?: Client): ClientFormInput =>
  c ? { name: c.name, contactName: c.contactName ?? '', contactEmail: c.contactEmail ?? '', notes: c.notes ?? '', isActive: c.isActive } : EMPTY;

/**
 * Add or edit a client in a side drawer (house rule: forms open in a drawer).
 * Closes via Cancel, Save, X or Escape (asked first once something changed).
 */
export function ClientFormSheet({ open, onOpenChange, client }: ClientFormSheetProps) {
  const isEdit = Boolean(client);
  const save = useSaveClient();
  const form = useForm<ClientFormInput, unknown, ClientFormValues>({ resolver: zodResolver(clientFormSchema), defaultValues: EMPTY });
  const { errors } = form.formState;

  useEffect(() => {
    if (open) form.reset(toForm(client));
  }, [open, client, form]);

  const onSubmit = async (values: ClientFormValues) => {
    try {
      const saved = await save.mutateAsync({ id: client?.id, input: values });
      showToaster('success', isEdit ? `${saved.name} saved.` : `${saved.name} added. Now add its sites.`);
      onOpenChange(false);
    } catch (error) {
      handleApiValidationError(error, form.setError);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg">
        <SheetHeader className="border-b">
          <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Client</p>
          <SheetTitle className="text-lg">{isEdit ? client?.name : 'Add client'}</SheetTitle>
          <SheetDescription>A business you do SEO for (or your own). Its websites are added under Sites.</SheetDescription>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="relative flex-1 space-y-4 overflow-y-auto p-4">
            <FormField id="client-name" label="Name" error={errors.name?.message} required>
              <Input {...fieldAria('client-name', errors.name?.message)} aria-required autoFocus placeholder="e.g. Karoo Coffee Roasters" {...form.register('name')} />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="client-contact" label="Contact person (optional)" error={errors.contactName?.message}>
                <Input {...fieldAria('client-contact', errors.contactName?.message)} autoComplete="off" {...form.register('contactName')} />
              </FormField>
              <FormField id="client-email" label="Contact email (optional)" error={errors.contactEmail?.message}>
                <Input
                  {...fieldAria('client-email', errors.contactEmail?.message)}
                  type="email"
                  autoComplete="off"
                  placeholder="name@client.co.za"
                  {...form.register('contactEmail')}
                />
              </FormField>
            </div>
            <FormField id="client-notes" label="Notes (optional)" error={errors.notes?.message}>
              <Textarea {...fieldAria('client-notes', errors.notes?.message)} rows={3} placeholder="e.g. Retainer since March; reports go to the marketing manager." {...form.register('notes')} />
            </FormField>
            <SwitchRow label="Active" hint="Inactive clients drop out of the pickers; their sites and history are kept.">
              {({ id, hintId }) => (
                <Controller
                  control={form.control}
                  name="isActive"
                  render={({ field }) => <Switch id={id} aria-describedby={hintId} checked={field.value} onCheckedChange={field.onChange} />}
                />
              )}
            </SwitchRow>
          </div>

          <SheetFooter className="flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={save.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending && <Loader2 className="animate-spin" />}
              {isEdit ? 'Save changes' : 'Add client'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
