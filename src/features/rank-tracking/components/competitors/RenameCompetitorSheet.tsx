import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/features/auth/components/FormField';
import { fieldAria } from '@/features/auth/lib/fieldAria';
import showToaster from '@/utils/showToaster';
import { handleApiValidationError } from '@/utils/formErrorHandler';
import { useUpdateCompetitor } from '../../hooks/useCompetitors';
import { COMPETITOR_NAME_MAX, renameCompetitorSchema, type RenameCompetitorValues } from '../../schemas/competitorSchema';
import type { Competitor } from '../../types';

interface Props {
  siteId: number;
  /** The competitor to rename; undefined closes the drawer. */
  competitor: Competitor | undefined;
  onClose: () => void;
}

/** A competitor's label in charts and tables; blank goes back to its domain. */
export function RenameCompetitorSheet({ siteId, competitor, onClose }: Props) {
  const save = useUpdateCompetitor(siteId);
  const form = useForm<RenameCompetitorValues>({ resolver: zodResolver(renameCompetitorSchema), defaultValues: { name: '' } });
  const { errors } = form.formState;

  useEffect(() => {
    if (competitor) form.reset({ name: competitor.name === competitor.domain ? '' : competitor.name });
  }, [competitor, form]);

  const onSubmit = async (values: RenameCompetitorValues) => {
    if (!competitor) return;
    try {
      const saved = await save.mutateAsync({ id: competitor.id, update: { name: values.name || competitor.domain } });
      showToaster('success', `Saved as ${saved.name}.`);
      onClose();
    } catch (error) {
      handleApiValidationError(error, form.setError);
    }
  };

  return (
    <Sheet open={Boolean(competitor)} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Competitor</p>
          <SheetTitle className="text-lg">Rename {competitor?.domain}</SheetTitle>
          <SheetDescription>The name shown in charts, tables and alert emails.</SheetDescription>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto p-4">
            <FormField id="rename-competitor" label="Name" error={errors.name?.message} hint="Leave blank to show the domain.">
              <Input {...fieldAria('rename-competitor', errors.name?.message, true)} autoComplete="off" maxLength={COMPETITOR_NAME_MAX} placeholder={competitor?.domain} {...form.register('name')} />
            </FormField>
          </div>

          <SheetFooter className="flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={save.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending && <Loader2 className="animate-spin" />}
              Save name
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
