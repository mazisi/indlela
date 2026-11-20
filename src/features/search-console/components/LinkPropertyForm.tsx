import { useForm, Controller, type UseFormSetError } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { FormField } from '@/features/auth/components/FormField';
import { FormAlert } from '@/features/auth/components/FormAlert';
import { fieldAria } from '@/features/auth/lib/fieldAria';
import { getApiErrorMessage, handleApiValidationError } from '@/utils/formErrorHandler';
import showToaster from '@/utils/showToaster';
import { useGoogleProperties, useLinkProperty } from '../hooks/useSearchConsole';
import { permissionLabel, propertyLabel, suggestProperty } from '../lib/properties';
import { linkPropertySchema, type LinkPropertyValues } from '../schemas/linkPropertySchema';
import type { GscSite } from '../types';

interface Props {
  site: GscSite;
  /** After a successful link (e.g. close the drawer). */
  onLinked?: () => void;
  onCancel?: () => void;
  submitLabel?: string;
}

/**
 * Picks the Search Console property for a site from what the connected Google
 * account can see; the property matching the site's domain is preselected.
 */
export function LinkPropertyForm({ site, onLinked, onCancel, submitLabel = 'Link property' }: Props) {
  const properties = useGoogleProperties(true);
  const link = useLinkProperty();

  if (properties.isPending) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Loading your Search Console properties">
        <Skeleton className="h-3.5 w-36 rounded" />
        <Skeleton className="h-9 w-full rounded" />
        <Skeleton className="h-9 w-32 rounded" />
      </div>
    );
  }
  if (properties.isError) {
    return (
      <FormAlert tone="error">
        <p>{getApiErrorMessage(properties.error, 'We could not load your Search Console properties.')}</p>
        <p>
          <button type="button" className="font-medium underline" onClick={() => properties.refetch()}>
            Try again
          </button>
        </p>
      </FormAlert>
    );
  }
  if (properties.data.length === 0) {
    return (
      <FormAlert tone="warning">
        <p>This Google account can't see any Search Console properties.</p>
        <p>Add and verify the site in Google Search Console, or connect a Google account that has access to it.</p>
      </FormAlert>
    );
  }

  return (
    <PropertyFormBody
      key={site.id}
      site={site}
      options={properties.data}
      pending={link.isPending}
      submitLabel={submitLabel}
      onCancel={onCancel}
      onSubmit={async (values, setError) => {
        try {
          await link.mutateAsync({ siteId: site.id, property: values.property });
          showToaster('success', `${site.name} linked. Importing its Search Console data…`);
          onLinked?.();
        } catch (error) {
          handleApiValidationError(error, setError);
        }
      }}
    />
  );
}

function PropertyFormBody({
  site,
  options,
  pending,
  submitLabel,
  onCancel,
  onSubmit,
}: {
  site: GscSite;
  options: { siteUrl: string; permissionLevel: string }[];
  pending: boolean;
  submitLabel: string;
  onCancel?: () => void;
  onSubmit: (values: LinkPropertyValues, setError: UseFormSetError<LinkPropertyValues>) => Promise<void>;
}) {
  const form = useForm<LinkPropertyValues>({
    resolver: zodResolver(linkPropertySchema),
    defaultValues: { property: site.gscProperty ?? suggestProperty(options, site.url) ?? '' },
  });
  const error = form.formState.errors.property?.message;
  const id = `gsc-property-${site.id}`;

  return (
    <form
      noValidate
      className="space-y-3"
      onSubmit={(e) => {
        e.stopPropagation();
        void form.handleSubmit((values) => onSubmit(values, form.setError))(e);
      }}
    >
      <FormField id={id} label="Search Console property" error={error} hint="Domain properties cover every subdomain and http/https.">
        <Controller
          control={form.control}
          name="property"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full bg-card" {...fieldAria(id, error, true)}>
                <SelectValue placeholder="Choose a property" />
              </SelectTrigger>
              <SelectContent>
                {options.map((p) => {
                  const { name, kind } = propertyLabel(p.siteUrl);
                  return (
                    <SelectItem key={p.siteUrl} value={p.siteUrl} disabled={p.permissionLevel === 'siteUnverifiedUser'}>
                      <span className="truncate">{name}</span>
                      <span className="text-xs text-muted-foreground">
                        {kind} · {permissionLabel(p.permissionLevel)}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
        />
      </FormField>
      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Link2 />}
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
