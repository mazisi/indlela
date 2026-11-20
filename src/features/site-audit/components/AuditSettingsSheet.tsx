import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FormField } from '@/features/auth/components/FormField';
import { fieldAria } from '@/features/auth/lib/fieldAria';
import { cn } from '@/lib/utils';
import showToaster from '@/utils/showToaster';
import { handleApiValidationError } from '@/utils/formErrorHandler';
import { useSaveAuditSettings } from '../hooks/useSiteAudit';
import { PAGE_LIMIT_MAX, PAGE_LIMIT_MIN, auditSettingsSchema, type AuditSettingsValues } from '../schemas/auditSettingsSchema';
import type { AuditSchedule, AuditSite } from '../types';

const SCHEDULES: { value: AuditSchedule; label: string; hint: string }[] = [
  { value: 'off', label: 'Manual only', hint: 'Audits run only when someone clicks Run audit.' },
  { value: 'weekly', label: 'Weekly', hint: 'Every week, so problems are caught within days.' },
  { value: 'monthly', label: 'Monthly', hint: 'Once a month, in time for the monthly report.' },
];

interface Props {
  site: AuditSite;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const toForm = (site: AuditSite): AuditSettingsValues => ({ auditSchedule: site.auditSchedule, auditPageLimit: site.auditPageLimit });

/** How often a site is audited and how many pages a crawl reads. */
export function AuditSettingsSheet({ site, open, onOpenChange }: Props) {
  const save = useSaveAuditSettings();
  const form = useForm<AuditSettingsValues>({ resolver: zodResolver(auditSettingsSchema), defaultValues: toForm(site) });
  const { errors } = form.formState;

  // Fresh values each time it opens; keyed on the values, not the site object, which polling replaces every few seconds.
  const { auditSchedule, auditPageLimit } = site;
  useEffect(() => {
    if (open) form.reset({ auditSchedule, auditPageLimit });
  }, [open, auditSchedule, auditPageLimit, form]);

  const onSubmit = async (values: AuditSettingsValues) => {
    try {
      await save.mutateAsync({ siteId: site.id, settings: values });
      showToaster('success', `Audit settings for ${site.name} saved.`);
      onOpenChange(false);
    } catch (error) {
      handleApiValidationError(error, form.setError);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg">
        <SheetHeader className="border-b">
          <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Audit settings</p>
          <SheetTitle className="text-lg">{site.name}</SheetTitle>
          <SheetDescription>When the site is crawled and how far the crawl goes. Changes apply from the next audit.</SheetDescription>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto p-4">
            <fieldset className="space-y-1.5">
              <legend className="mb-1.5 text-sm font-medium text-foreground">Schedule</legend>
              <Controller
                control={form.control}
                name="auditSchedule"
                render={({ field }) => (
                  <RadioGroup value={field.value} onValueChange={field.onChange} aria-label="Schedule" className="gap-2">
                    {SCHEDULES.map((s) => (
                      <label
                        key={s.value}
                        htmlFor={`audit-schedule-${s.value}`}
                        className={cn(
                          'flex cursor-pointer items-start gap-3 rounded border bg-card px-3 py-2.5 transition-colors',
                          field.value === s.value ? 'border-primary/50 ring-1 ring-primary/30' : 'hover:border-primary/30',
                        )}
                      >
                        <RadioGroupItem id={`audit-schedule-${s.value}`} value={s.value} className="mt-0.5" />
                        <span>
                          <span className="block text-sm font-medium">{s.label}</span>
                          <span className="block text-xs text-muted-foreground">{s.hint}</span>
                        </span>
                      </label>
                    ))}
                  </RadioGroup>
                )}
              />
              {errors.auditSchedule && (
                <p role="alert" className="text-xs text-destructive">
                  {errors.auditSchedule.message}
                </p>
              )}
            </fieldset>

            <FormField
              id="audit-page-limit"
              label="Page limit"
              error={errors.auditPageLimit?.message}
              required
              hint={`The most pages one audit crawls: ${PAGE_LIMIT_MIN}–${PAGE_LIMIT_MAX.toLocaleString('en-GB')}. Bigger sites take longer.`}
            >
              <Input
                {...fieldAria('audit-page-limit', errors.auditPageLimit?.message, true)}
                aria-required
                type="number"
                inputMode="numeric"
                min={PAGE_LIMIT_MIN}
                max={PAGE_LIMIT_MAX}
                step={50}
                className="w-40"
                {...form.register('auditPageLimit', { valueAsNumber: true })}
              />
            </FormField>
          </div>

          <SheetFooter className="flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={save.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending && <Loader2 className="animate-spin" />}
              Save settings
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
