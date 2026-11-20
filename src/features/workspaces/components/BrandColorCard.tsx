import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, RotateCcw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FormField } from '@/features/auth/components/FormField';
import { fieldAria } from '@/features/auth/lib/fieldAria';
import type { WorkspaceRef } from '@/features/auth/types';
import { brandStyle, brandTheme, DEFAULT_BRAND_COLOR, HEX_COLOR, INK_LIGHT } from '@/features/reports/lib/brand';
import { AgencyMark } from '@/features/reports/components/view/ReportHeader';
import showToaster from '@/utils/showToaster';
import { handleApiValidationError } from '@/utils/formErrorHandler';
import { useUpdateWorkspace } from '../hooks/useWorkspace';
import { brandColorSchema, toBrandColor, type BrandColorValues } from '../schemas/brandColorSchema';

/** How a report's header looks in the colour: the band with the logo and name, and a section heading's rule. */
function BrandPreview({ workspace, color }: { workspace: WorkspaceRef; color: string }) {
  const theme = brandTheme(color);
  return (
    <figure className="overflow-hidden rounded border" style={brandStyle(color)} aria-label="Preview of a report header in this colour" data-testid="brand-preview" data-ink={theme.ink}>
      <div className="flex items-center gap-3 bg-(--brand) px-4 py-3 text-(--brand-ink)">
        <AgencyMark branding={{ name: workspace.name, logoUrl: workspace.logoUrl }} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{workspace.name}</p>
          <p className="text-xs opacity-85">SEO report · October 2026</p>
        </div>
      </div>
      <div className="bg-card px-4 py-3">
        <p className="border-b-2 border-(--brand-accent) pb-1 text-sm font-semibold">Search Console</p>
        <figcaption className="mt-2 text-xs text-muted-foreground">
          Text on it is {theme.ink === INK_LIGHT ? 'white' : 'dark'}, whichever reads better.
          {theme.accent !== theme.brand && ' Lines on white use a slightly darker shade so they stay visible.'}
        </figcaption>
      </div>
    </figure>
  );
}

/** Settings › Workspace: the brand colour on client reports and share links (a colour picker and its hex, with a live preview). */
export function BrandColorCard({ workspace, canUpdate }: { workspace: WorkspaceRef | undefined; canUpdate: boolean }) {
  const update = useUpdateWorkspace();
  const form = useForm<BrandColorValues>({ resolver: zodResolver(brandColorSchema), defaultValues: { brandColor: '' } });
  const { errors, isDirty } = form.formState;
  const typed = useWatch({ control: form.control, name: 'brandColor' });
  const candidate = toBrandColor(typed ?? '');
  const shown = candidate && HEX_COLOR.test(candidate) ? candidate : (workspace?.brandColor ?? DEFAULT_BRAND_COLOR);

  useEffect(() => {
    if (workspace) form.reset({ brandColor: workspace.brandColor ?? '' });
  }, [workspace, form]);

  const save = async (values: BrandColorValues) => {
    try {
      const saved = await update.mutateAsync({ brandColor: toBrandColor(values.brandColor) });
      form.reset({ brandColor: saved.brandColor ?? '' });
      showToaster('success', saved.brandColor ? 'Brand colour saved.' : 'Brand colour reset to the default.');
    } catch (error) {
      handleApiValidationError(error, form.setError);
    }
  };

  return (
    <Card className="rounded xl:col-span-2">
      <CardHeader>
        <CardTitle className="text-base">Brand colour</CardTitle>
        <CardDescription>Used on client reports and share links: the header, section headings and charts. Leave empty for the default navy.</CardDescription>
      </CardHeader>
      <CardContent>
        {workspace ? (
          <form onSubmit={form.handleSubmit(save)} noValidate className="grid gap-5 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
            <div className="space-y-4">
              <FormField id="ws-brand-color" label="Hex colour" error={errors.brandColor?.message} hint="e.g. #1f4e79. Pick it, or paste it from your brand guide.">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    aria-label="Pick a colour"
                    value={shown}
                    disabled={!canUpdate}
                    onChange={(e) => form.setValue('brandColor', e.target.value, { shouldDirty: true, shouldValidate: true })}
                    className="h-9 w-12 shrink-0 cursor-pointer rounded border bg-card p-1 disabled:cursor-not-allowed"
                  />
                  <Input {...fieldAria('ws-brand-color', errors.brandColor?.message, true)} placeholder={DEFAULT_BRAND_COLOR} autoComplete="off" spellCheck={false} disabled={!canUpdate} className="font-mono" {...form.register('brandColor')} />
                </div>
              </FormField>
              {canUpdate && (
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={!isDirty || update.isPending}>
                    {update.isPending && update.variables?.brandColor !== undefined ? <Loader2 className="animate-spin" /> : <Save />}
                    Save colour
                  </Button>
                  {(workspace.brandColor || typed) && (
                    <Button type="button" variant="ghost" className="text-muted-foreground" onClick={() => form.setValue('brandColor', '', { shouldDirty: true, shouldValidate: true })}>
                      <RotateCcw />
                      Use the default
                    </Button>
                  )}
                </div>
              )}
            </div>
            <BrandPreview workspace={workspace} color={shown} />
          </form>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]" aria-busy aria-label="Loading the brand colour">
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-24 rounded" />
              <Skeleton className="h-9 w-full rounded" />
            </div>
            <Skeleton className="h-28 w-full rounded" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
