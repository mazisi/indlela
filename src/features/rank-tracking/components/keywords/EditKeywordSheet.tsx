import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { SwitchRow } from '@/components/form/SwitchRow';
import { FormField } from '@/features/auth/components/FormField';
import { fieldAria } from '@/features/auth/lib/fieldAria';
import showToaster from '@/utils/showToaster';
import { handleApiValidationError } from '@/utils/formErrorHandler';
import { useUpdateKeyword } from '../../hooks/useRankTracking';
import { parseTags } from '../../lib/keywords';
import { DEVICE_LABEL, WEEKDAYS } from '../../lib/position';
import { editKeywordSchema, type EditKeywordValues } from '../../schemas/editKeywordSchema';
import type { RankKeyword } from '../../types';
import { FrequencyChoice } from '../add/FrequencyChoice';

interface Props {
  siteId: number;
  /** The keyword to edit; undefined closes the drawer. */
  keyword: RankKeyword | undefined;
  onClose: () => void;
}

const toForm = (k: RankKeyword | undefined): EditKeywordValues => ({
  frequency: k?.frequency ?? 'daily',
  weeklyDay: k?.weeklyDay === null || k?.weeklyDay === undefined ? '1' : String(k.weeklyDay),
  tagsText: k?.tags.join(', ') ?? '',
  isActive: k?.isActive ?? true,
});

/** A tracked keyword's schedule, tags and whether it's checked at all. */
export function EditKeywordSheet({ siteId, keyword, onClose }: Props) {
  const save = useUpdateKeyword(siteId);
  const form = useForm<EditKeywordValues>({ resolver: zodResolver(editKeywordSchema), defaultValues: toForm(keyword) });
  const { errors } = form.formState;
  const frequency = useWatch({ control: form.control, name: 'frequency' });

  useEffect(() => {
    if (keyword) form.reset(toForm(keyword));
  }, [keyword, form]);

  const onSubmit = async (values: EditKeywordValues) => {
    if (!keyword) return;
    try {
      await save.mutateAsync({
        id: keyword.id,
        update: {
          frequency: values.frequency,
          ...(values.frequency === 'weekly' ? { weeklyDay: Number(values.weeklyDay) } : {}),
          tags: parseTags(values.tagsText),
          isActive: values.isActive,
        },
      });
      showToaster('success', `“${keyword.keyword}” saved.`);
      onClose();
    } catch (error) {
      handleApiValidationError(error, form.setError, { tags: 'tagsText', weekly_day: 'weeklyDay', is_active: 'isActive' });
    }
  };

  return (
    <Sheet open={Boolean(keyword)} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg">
        <SheetHeader className="border-b">
          <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Tracked keyword</p>
          <SheetTitle className="text-lg">{keyword?.keyword}</SheetTitle>
          <SheetDescription>
            {keyword ? `${keyword.location.name} · ${DEVICE_LABEL[keyword.device]}. ` : ''}How often it's checked, its tags, and whether it's checked at all.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto p-4">
            <Controller control={form.control} name="frequency" render={({ field }) => <FrequencyChoice idPrefix="edit-frequency" value={field.value} onChange={field.onChange} error={errors.frequency?.message} />} />

            {frequency === 'weekly' && (
              <FormField id="edit-weekly-day" label="Day of the week" error={errors.weeklyDay?.message} required hint="Weekly checks run overnight on this day.">
                <Controller
                  control={form.control}
                  name="weeklyDay"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger {...fieldAria('edit-weekly-day', errors.weeklyDay?.message, true)} aria-required className="w-48">
                        <SelectValue placeholder="Choose a day" />
                      </SelectTrigger>
                      <SelectContent>
                        {WEEKDAYS.map((d) => (
                          <SelectItem key={d.value} value={String(d.value)}>
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
            )}

            <FormField id="edit-tags" label="Tags (optional)" error={errors.tagsText?.message} hint="Separate with commas, e.g. brand, services. Tags filter the keyword list.">
              <Input {...fieldAria('edit-tags', errors.tagsText?.message, true)} autoComplete="off" placeholder="brand, services" {...form.register('tagsText')} />
            </FormField>

            <SwitchRow label="Active" hint="Paused keywords aren't checked; their history is kept.">
              {({ id, hintId }) => (
                <Controller control={form.control} name="isActive" render={({ field }) => <Switch id={id} aria-describedby={hintId} checked={field.value} onCheckedChange={field.onChange} />} />
              )}
            </SwitchRow>
            {/* Resuming takes a place under the keyword limit: the API's 422 on is_active lands here. */}
            {errors.isActive && (
              <p role="alert" className="-mt-3 text-xs text-destructive">
                {errors.isActive.message}
              </p>
            )}
          </div>

          <SheetFooter className="flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={save.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending && <Loader2 className="animate-spin" />}
              Save changes
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
