import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { SwitchRow } from '@/components/form/SwitchRow';
import { FormField } from '@/features/auth/components/FormField';
import { fieldAria } from '@/features/auth/lib/fieldAria';
import type { ClientRef } from '@/features/auth/types';
import showToaster from '@/utils/showToaster';
import { handleApiValidationError } from '@/utils/formErrorHandler';
import { siteFormSchema, type SiteFormInput, type SiteFormValues } from '../schemas/siteSchema';
import { useSaveSite } from '../hooks/useSites';
import { ClientSelect } from './ClientSelect';
import type { Site } from '../types';

interface SiteFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The site to edit; omit to add one. */
  site?: Site;
  /** The clients a site can be added to. */
  clients: ClientRef[];
  /** Preselected when adding (the list's client filter). */
  clientId?: number;
}

const toForm = (site: Site | undefined, clientId: number | undefined): SiteFormInput =>
  site
    ? { clientId: site.clientId, url: site.url, name: site.name === site.domain ? '' : site.name, isActive: site.isActive }
    : { clientId: clientId ?? 0, url: '', name: '', isActive: true };

/**
 * Add or edit a client's website in a side drawer. A site stays with the
 * client it was added to; the name defaults to the domain.
 */
export function SiteFormSheet({ open, onOpenChange, site, clients, clientId }: SiteFormSheetProps) {
  const isEdit = Boolean(site);
  const save = useSaveSite();
  const form = useForm<SiteFormInput, unknown, SiteFormValues>({ resolver: zodResolver(siteFormSchema), defaultValues: toForm(undefined, clientId) });
  const { errors } = form.formState;

  useEffect(() => {
    if (open) form.reset(toForm(site, clientId));
  }, [open, site, clientId, form]);

  const onSubmit = async (values: SiteFormValues) => {
    try {
      const saved = await save.mutateAsync({ id: site?.id, input: values });
      showToaster('success', isEdit ? `${saved.name} saved.` : `${saved.name} added.`);
      onOpenChange(false);
    } catch (error) {
      handleApiValidationError(error, form.setError);
    }
  };

  // Editing a site of a client no longer in the picker (e.g. inactive) still shows its name.
  const options = site?.client && !clients.some((c) => c.id === site.clientId) ? [...clients, site.client] : clients;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg">
        <SheetHeader className="border-b">
          <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Site</p>
          <SheetTitle className="text-lg">{isEdit ? site?.name : 'Add site'}</SheetTitle>
          <SheetDescription>A client's website. Search Console, audits and rankings are set up per site.</SheetDescription>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="relative flex-1 space-y-4 overflow-y-auto p-4">
            <FormField
              id="site-client"
              label="Client"
              error={errors.clientId?.message}
              required
              hint={isEdit ? 'A site stays with the client it was added to.' : undefined}
            >
              <Controller
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <ClientSelect
                    id="site-client"
                    clients={options}
                    value={field.value || undefined}
                    onChange={(v) => field.onChange(v ?? 0)}
                    disabled={isEdit}
                    aria-invalid={errors.clientId ? true : undefined}
                    aria-describedby={errors.clientId ? 'site-client-error' : isEdit ? 'site-client-hint' : undefined}
                  />
                )}
              />
            </FormField>
            <FormField id="site-url" label="Website address" error={errors.url?.message} required hint="e.g. www.example.co.za; one site per domain in the workspace.">
              <Input
                {...fieldAria('site-url', errors.url?.message, true)}
                aria-required
                inputMode="url"
                autoComplete="off"
                autoFocus={!isEdit}
                placeholder="www.example.co.za"
                {...form.register('url')}
              />
            </FormField>
            <FormField id="site-name" label="Name (optional)" error={errors.name?.message} hint="Leave blank to use the domain.">
              <Input {...fieldAria('site-name', errors.name?.message, true)} autoComplete="off" placeholder="e.g. Online shop" {...form.register('name')} />
            </FormField>
            <SwitchRow label="Active" hint="Inactive sites are left out of crawls, rank checks and reports; their history is kept.">
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
              {isEdit ? 'Save changes' : 'Add site'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
