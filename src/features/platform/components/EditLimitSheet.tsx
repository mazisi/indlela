import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FormField } from '@/features/auth/components/FormField';
import { fieldAria } from '@/features/auth/lib/fieldAria';
import { formatNumber } from '@/features/search-console/lib/format';
import { cn } from '@/lib/utils';
import showToaster from '@/utils/showToaster';
import { handleApiValidationError } from '@/utils/formErrorHandler';
import { useUpdateWorkspaceLimit } from '../hooks/usePlatformUsage';
import { KEYWORD_LIMIT_MAX, KEYWORD_LIMIT_MIN, toLimit, workspaceLimitSchema, type WorkspaceLimitValues } from '../schemas/workspaceLimitSchema';
import type { WorkspaceUsage } from '../types';

interface Props {
  /** The workspace to edit; undefined closes the drawer. */
  workspace: WorkspaceUsage | undefined;
  /** The platform default (500). */
  defaultLimit: number;
  onClose: () => void;
}

const toForm = (w: WorkspaceUsage | undefined): WorkspaceLimitValues => ({
  mode: w?.keywordLimitOverride != null ? 'custom' : 'default',
  limit: w?.keywordLimitOverride != null ? String(w.keywordLimitOverride) : '',
});

/** A workspace's own active-keyword limit, or back to the platform default. */
export function EditLimitSheet({ workspace, defaultLimit, onClose }: Props) {
  const save = useUpdateWorkspaceLimit();
  const form = useForm<WorkspaceLimitValues>({ resolver: zodResolver(workspaceLimitSchema), defaultValues: toForm(workspace) });
  const { errors } = form.formState;
  const [mode, limit] = useWatch({ control: form.control, name: ['mode', 'limit'] });

  useEffect(() => {
    if (workspace) form.reset(toForm(workspace));
  }, [workspace, form]);

  const effective = mode === 'custom' ? Number(limit) : defaultLimit;
  const belowUsage = workspace && Number.isInteger(effective) && effective > 0 && effective < workspace.keywordsTracked;

  const onSubmit = async (values: WorkspaceLimitValues) => {
    if (!workspace) return;
    const next = toLimit(values);
    try {
      await save.mutateAsync({ id: workspace.id, limit: next });
      showToaster('success', next === null ? `${workspace.name} is back on the default limit.` : `${workspace.name} may now track ${formatNumber(next)} keywords.`);
      onClose();
    } catch (error) {
      handleApiValidationError(error, form.setError, { rank_keyword_limit: 'limit' });
    }
  };

  const options = [
    { value: 'default' as const, label: `Use default (${formatNumber(defaultLimit)})`, hint: 'Follows the platform limit if it changes.' },
    { value: 'custom' as const, label: 'Custom limit', hint: 'For a pilot, a bigger agency or a paid plan.' },
  ];

  return (
    <Sheet open={Boolean(workspace)} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg">
        <SheetHeader className="border-b">
          <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Keyword limit</p>
          <SheetTitle className="text-lg">{workspace?.name}</SheetTitle>
          <SheetDescription>
            The most active keywords (keyword × location × device) this workspace may track. It tracks {formatNumber(workspace?.keywordsTracked ?? 0)} now.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            <fieldset className="space-y-1.5">
              <legend className="mb-1.5 text-sm font-medium text-foreground">Limit</legend>
              <Controller
                control={form.control}
                name="mode"
                render={({ field }) => (
                  <RadioGroup
                    value={field.value}
                    onValueChange={(v) => {
                      field.onChange(v);
                      form.clearErrors('limit');
                    }}
                    aria-label="Limit"
                    className="gap-2"
                  >
                    {options.map((o) => (
                      <label
                        key={o.value}
                        htmlFor={`limit-mode-${o.value}`}
                        className={cn(
                          'flex cursor-pointer items-start gap-3 rounded border bg-card px-3 py-2.5 transition-colors',
                          field.value === o.value ? 'border-primary/50 ring-1 ring-primary/30' : 'hover:border-primary/30',
                        )}
                      >
                        <RadioGroupItem id={`limit-mode-${o.value}`} value={o.value} className="mt-0.5" />
                        <span>
                          <span className="block text-sm font-medium">{o.label}</span>
                          <span className="block text-xs text-muted-foreground">{o.hint}</span>
                        </span>
                      </label>
                    ))}
                  </RadioGroup>
                )}
              />
            </fieldset>

            {mode === 'custom' && (
              <FormField
                id="workspace-limit"
                label="Keywords"
                required
                error={errors.limit?.message}
                hint={`${KEYWORD_LIMIT_MIN}–${KEYWORD_LIMIT_MAX.toLocaleString('en-GB')} active keywords.`}
              >
                <Input
                  {...fieldAria('workspace-limit', errors.limit?.message, true)}
                  aria-required
                  autoFocus
                  type="number"
                  inputMode="numeric"
                  min={KEYWORD_LIMIT_MIN}
                  max={KEYWORD_LIMIT_MAX}
                  step={10}
                  className="w-40"
                  {...form.register('limit')}
                />
              </FormField>
            )}

            {belowUsage && (
              <p role="status" className="flex items-start gap-2 rounded border border-warn/30 bg-warn-soft px-3 py-2 text-xs text-warn">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                <span>
                  Below the {formatNumber(workspace.keywordsTracked)} it tracks now. Nothing is removed, but it can't add or resume keywords until it's under the limit.
                </span>
              </p>
            )}
          </div>

          <SheetFooter className="flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={save.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending && <Loader2 className="animate-spin" />}
              Save limit
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
