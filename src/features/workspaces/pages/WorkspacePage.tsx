import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ImageUp, Loader2, Save, Trash2 } from 'lucide-react';
import { Head } from '@/components/ui/Head';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page/PageHeader';
import { ChangeHistorySheet } from '@/components/history/ChangeHistorySheet';
import { usePermissions } from '@/contexts/PermissionContextType';
import { FormAlert } from '@/features/auth/components/FormAlert';
import { FormField } from '@/features/auth/components/FormField';
import { fieldAria } from '@/features/auth/lib/fieldAria';
import showToaster from '@/utils/showToaster';
import { getApiErrorMessage, handleApiValidationError } from '@/utils/formErrorHandler';
import { WorkspaceLogo } from '../components/WorkspaceLogo';
import { useUpdateWorkspace, useWorkspace, useWorkspaceHistory } from '../hooks/useWorkspace';

const PAGE_TITLE = 'Workspace';
const FIELD_LABELS: Record<string, string> = { name: 'Name', logo_path: 'Logo', slug: 'Address' };
const LOGO_TYPES = 'image/png,image/jpeg,image/svg+xml,image/webp';
const MAX_LOGO = 2 * 1024 * 1024;

const nameSchema = z.object({ name: z.string().trim().min(2, 'Enter the workspace name.').max(100, 'At most 100 characters.') });
type NameValues = z.infer<typeof nameSchema>;

/**
 * Settings › Workspace (Owners): the agency or business name and the logo
 * used on white-label reports.
 */
export default function WorkspacePage() {
  const { hasPermission } = usePermissions();
  const canUpdate = hasPermission('update_settings_workspace');
  const query = useWorkspace();
  const workspace = query.data;
  const update = useUpdateWorkspace();
  const [historyPage, setHistoryPage] = useState(1);
  const [historyOpen, setHistoryOpen] = useState(false);
  const history = useWorkspaceHistory(historyPage);
  const fileInput = useRef<HTMLInputElement>(null);

  const form = useForm<NameValues>({ resolver: zodResolver(nameSchema), defaultValues: { name: '' } });
  const { errors, isDirty } = form.formState;
  useEffect(() => {
    if (workspace) form.reset({ name: workspace.name });
  }, [workspace, form]);

  const saveName = async (values: NameValues) => {
    try {
      const saved = await update.mutateAsync({ name: values.name });
      form.reset({ name: saved.name });
      showToaster('success', 'Workspace name saved.');
    } catch (error) {
      handleApiValidationError(error, form.setError);
    }
  };

  const changeLogo = async (input: { logo?: File; removeLogo?: boolean }, done: string) => {
    try {
      await update.mutateAsync(input);
      showToaster('success', done);
    } catch (error) {
      showToaster('error', getApiErrorMessage(error, 'Could not change the logo.'));
    }
  };

  const onPick = (file: File | undefined) => {
    if (fileInput.current) fileInput.current.value = '';
    if (!file) return;
    if (!LOGO_TYPES.split(',').includes(file.type)) return showToaster('error', 'Choose a PNG, JPG, SVG or WebP image.');
    if (file.size > MAX_LOGO) return showToaster('error', 'The logo must be 2 MB or smaller.');
    void changeLogo({ logo: file }, 'Logo saved.');
  };

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <Head title={PAGE_TITLE} />
      <PageHeader
        eyebrow="Settings · Owner"
        title={PAGE_TITLE}
        description="Your agency or business. The name shows in the workspace switcher; the logo goes on your white-label reports."
        actions={
          <Button
            variant="outline"
            onClick={() => {
              setHistoryPage(1);
              setHistoryOpen(true);
            }}
            title="Who changed what on this page, and when"
          >
            History
            {history.data && <span className="rounded bg-secondary px-1.5 text-xs tabular-nums text-muted-foreground">{history.data.meta.total}</span>}
          </Button>
        }
      />

      {query.isError ? (
        <FormAlert tone="error">
          <p>{getApiErrorMessage(query.error, 'We could not load the workspace.')}</p>
          <p>
            <button type="button" className="font-medium underline" onClick={() => query.refetch()}>
              Try again
            </button>
          </p>
        </FormAlert>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          <Card className="rounded">
            <CardHeader>
              <CardTitle className="text-base">Name</CardTitle>
              <CardDescription>Your agency or business, e.g. Sandton Digital.</CardDescription>
            </CardHeader>
            <CardContent>
              {workspace ? (
                <form onSubmit={form.handleSubmit(saveName)} noValidate className="space-y-4">
                  <FormField id="ws-name" label="Workspace name" error={errors.name?.message} required className="max-w-md">
                    <Input {...fieldAria('ws-name', errors.name?.message)} aria-required disabled={!canUpdate} {...form.register('name')} />
                  </FormField>
                  {canUpdate && (
                    <Button type="submit" disabled={!isDirty || update.isPending}>
                      {update.isPending && update.variables?.name !== undefined ? <Loader2 className="animate-spin" /> : <Save />}
                      Save
                    </Button>
                  )}
                </form>
              ) : (
                <div className="max-w-md space-y-2" aria-busy aria-label="Loading the workspace">
                  <Skeleton className="h-3.5 w-28 rounded" />
                  <Skeleton className="h-9 w-full rounded" />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded">
            <CardHeader>
              <CardTitle className="text-base">Logo</CardTitle>
              <CardDescription>PNG, JPG, SVG or WebP, up to 2 MB. Shown on reports and in the sidebar.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-4">
              {workspace ? <WorkspaceLogo workspace={workspace} className="size-16 text-xl" /> : <Skeleton className="size-16 rounded" />}
              {canUpdate && workspace && (
                <div className="flex flex-wrap gap-2">
                  <input ref={fileInput} type="file" accept={LOGO_TYPES} className="sr-only" id="ws-logo" onChange={(e) => onPick(e.target.files?.[0])} />
                  <Button type="button" variant="outline" onClick={() => fileInput.current?.click()} disabled={update.isPending}>
                    {update.isPending && update.variables?.logo ? <Loader2 className="animate-spin" /> : <ImageUp />}
                    {workspace.logoUrl ? 'Replace logo' : 'Upload logo'}
                  </Button>
                  {workspace.logoUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-bad hover:bg-bad-soft hover:text-bad"
                      onClick={() => void changeLogo({ removeLogo: true }, 'Logo removed.')}
                      disabled={update.isPending}
                    >
                      <Trash2 />
                      Remove
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <ChangeHistorySheet
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        pageTitle={PAGE_TITLE}
        history={history.data}
        isPending={history.isPending}
        isError={history.isError}
        onRetry={() => history.refetch()}
        onPageChange={setHistoryPage}
        fieldLabels={FIELD_LABELS}
      />
    </div>
  );
}
