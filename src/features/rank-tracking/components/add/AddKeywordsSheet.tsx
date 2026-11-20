import { useEffect, type FormEvent } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Monitor, Smartphone } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/features/auth/components/FormField';
import { fieldAria } from '@/features/auth/lib/fieldAria';
import { cn } from '@/lib/utils';
import showToaster from '@/utils/showToaster';
import { handleApiValidationError } from '@/utils/formErrorHandler';
import { useAddKeywords, useRankUsage } from '../../hooks/useRankTracking';
import { MAX_KEYWORDS, parseKeywords, parseTags } from '../../lib/keywords';
import { DEVICE_LABEL } from '../../lib/position';
import { keywordsLeft, keywordsToAdd } from '../../lib/usage';
import { addKeywordsSchema, DEFAULT_LOCATION, type AddKeywordsValues } from '../../schemas/addKeywordsSchema';
import type { Device } from '../../types';
import { FrequencyChoice } from './FrequencyChoice';
import { KeywordAllowance } from './KeywordAllowance';
import { LocationPicker } from './LocationPicker';

const DEFAULTS: AddKeywordsValues = { keywordsText: '', locations: [DEFAULT_LOCATION], devices: ['desktop', 'mobile'], frequency: 'weekly', tagsText: '' };

const DEVICES: { value: Device; icon: typeof Monitor }[] = [
  { value: 'desktop', icon: Monitor },
  { value: 'mobile', icon: Smartphone },
];

/**
 * Laravel names array errors `keywords.3`, `locations.0.coordinate`: bind them
 * to the form's field for the whole list.
 */
function normaliseErrors(error: unknown): unknown {
  const res = (error as { response?: { status?: number; data?: { errors?: Record<string, string[]> } } }).response;
  if (res?.status !== 422 || !res.data?.errors) return error;
  const errors: Record<string, string[]> = {};
  for (const [key, messages] of Object.entries(res.data.errors)) {
    const root = key.split('.')[0];
    errors[root] ??= messages;
  }
  return { ...(error as object), response: { ...res, data: { ...res.data, errors } } };
}

interface Props {
  siteId: number;
  siteName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Add keywords to a site: one per line, where, on which devices and how often, with what it counts against the keyword limit as you type. */
export function AddKeywordsSheet({ siteId, siteName, open, onOpenChange }: Props) {
  const add = useAddKeywords(siteId);
  const usage = useRankUsage();
  const form = useForm<AddKeywordsValues>({ resolver: zodResolver(addKeywordsSchema), defaultValues: DEFAULTS });
  const { errors } = form.formState;
  const [text, locations, devices] = useWatch({ control: form.control, name: ['keywordsText', 'locations', 'devices'] });
  const parsed = parseKeywords(text);
  // The API has the last word (422 on `keywords`); this stops an Add that clearly can't fit.
  const overLimit = usage.data !== undefined && keywordsToAdd(parsed.keywords.length, locations.length, devices.length) > keywordsLeft(usage.data);

  useEffect(() => {
    if (open) form.reset(DEFAULTS);
  }, [open, form]);

  const onValid = async (values: AddKeywordsValues) => {
    const tags = parseTags(values.tagsText);
    try {
      const result = await add.mutateAsync({
        keywords: parseKeywords(values.keywordsText).keywords,
        locations: values.locations,
        devices: values.devices,
        frequency: values.frequency,
        ...(tags.length ? { tags } : {}),
      });
      showToaster(result.created ? 'success' : 'default', `Added ${result.created}, skipped ${result.skipped} already tracked.`);
      onOpenChange(false);
    } catch (error) {
      handleApiValidationError(normaliseErrors(error), form.setError, { keywords: 'keywordsText', tags: 'tagsText' });
    }
  };

  // The drawer may be opened from inside another form: keep its submit to itself.
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.stopPropagation();
    void form.handleSubmit(onValid)(e);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-xl">
        <SheetHeader className="border-b">
          <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Rank tracking · {siteName}</p>
          <SheetTitle className="text-lg">Add keywords</SheetTitle>
          <SheetDescription>Each keyword is tracked in every location, on every device you choose. Keywords already tracked there are skipped.</SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto p-4">
            <FormField
              id="add-keywords"
              label="Keywords"
              error={errors.keywordsText?.message}
              required
              aside={
                <span className="text-xs tabular-nums text-muted-foreground" aria-live="polite" data-testid="keyword-count">
                  {parsed.keywords.length} {parsed.keywords.length === 1 ? 'keyword' : 'keywords'}
                  {parsed.duplicates > 0 && ` · ${parsed.duplicates} duplicate${parsed.duplicates === 1 ? '' : 's'} removed`}
                </span>
              }
              hint={`One per line, up to ${MAX_KEYWORDS}. Repeats are removed.`}
            >
              <Textarea
                {...fieldAria('add-keywords', errors.keywordsText?.message, true)}
                aria-required
                rows={7}
                autoFocus
                placeholder={'plumber sandton\nemergency plumber johannesburg\ngeyser repairs'}
                className="font-mono text-sm"
                {...form.register('keywordsText')}
              />
            </FormField>

            <Controller control={form.control} name="locations" render={({ field }) => <LocationPicker id="add-locations" value={field.value} onChange={field.onChange} error={errors.locations?.message ?? errors.locations?.root?.message} />} />

            <fieldset className="space-y-1.5">
              <legend className="mb-1.5 text-sm font-medium text-foreground">Devices</legend>
              <Controller
                control={form.control}
                name="devices"
                render={({ field }) => (
                  <div className="flex flex-wrap gap-2">
                    {DEVICES.map(({ value, icon: Icon }) => {
                      const checked = field.value.includes(value);
                      return (
                        <label
                          key={value}
                          htmlFor={`add-device-${value}`}
                          className={cn('flex cursor-pointer items-center gap-2 rounded border bg-card px-3 py-2 text-sm transition-colors', checked ? 'border-primary/50 ring-1 ring-primary/30' : 'hover:border-primary/30')}
                        >
                          <Checkbox
                            id={`add-device-${value}`}
                            checked={checked}
                            onCheckedChange={(v) => field.onChange(v === true ? [...field.value, value] : field.value.filter((d) => d !== value))}
                          />
                          <Icon className="size-4 text-muted-foreground" aria-hidden />
                          {DEVICE_LABEL[value]}
                        </label>
                      );
                    })}
                  </div>
                )}
              />
              {errors.devices && (
                <p role="alert" className="text-xs text-destructive">
                  {errors.devices.message}
                </p>
              )}
            </fieldset>

            <Controller control={form.control} name="frequency" render={({ field }) => <FrequencyChoice idPrefix="add-frequency" value={field.value} onChange={field.onChange} error={errors.frequency?.message} />} />

            <FormField id="add-tags" label="Tags (optional)" error={errors.tagsText?.message} hint="Separate with commas, e.g. services, johannesburg. Tags filter the keyword list.">
              <Input {...fieldAria('add-tags', errors.tagsText?.message, true)} autoComplete="off" placeholder="services, johannesburg" {...form.register('tagsText')} />
            </FormField>

            <KeywordAllowance keywords={parsed.keywords.length} locations={locations.length} devices={devices.length} usage={usage.data} />
          </div>

          <SheetFooter className="flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={add.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={add.isPending || overLimit}>
              {add.isPending && <Loader2 className="animate-spin" />}
              Add {parsed.keywords.length > 0 ? `${parsed.keywords.length} ${parsed.keywords.length === 1 ? 'keyword' : 'keywords'}` : 'keywords'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
