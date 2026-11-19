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
import { roleFormSchema, type RoleFormValues } from '../schemas/roleSchema';
import { useSaveRole } from '../hooks/useRoles';
import type { Role } from '../types';

interface RoleFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The role to edit; omit to add one. */
  role?: Role;
  onSaved: (role: Role, created: boolean) => void;
}

/**
 * Add a role or change its name and description, in a drawer that closes
 * only via Cancel, Save or X. Menu access is set in the grid afterwards.
 */
export function RoleFormSheet({ open, onOpenChange, role, onSaved }: RoleFormSheetProps) {
  const isEdit = Boolean(role);
  const save = useSaveRole();
  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: { name: '', description: '', allClients: false },
  });
  const { errors } = form.formState;

  useEffect(() => {
    if (open) form.reset({ name: role?.name ?? '', description: role?.description ?? '', allClients: role?.allClients ?? false });
  }, [open, role, form]);

  const onSubmit = async (values: RoleFormValues) => {
    try {
      const saved = await save.mutateAsync({ id: role?.id, input: values });
      showToaster('success', isEdit ? `${saved.name} saved.` : `${saved.name} added. Now choose what it can do.`);
      onSaved(saved, !isEdit);
      onOpenChange(false);
    } catch (error) {
      handleApiValidationError(error, form.setError);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Role</p>
          <SheetTitle className="text-lg">{isEdit ? role?.name : 'Add role'}</SheetTitle>
          <SheetDescription>
            {isEdit ? 'Change the name or description. Menu access is set in the grid.' : 'Name the role, then choose what it can do in the grid.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="relative flex-1 space-y-4 overflow-y-auto p-4">
            <FormField id="role-name" label="Role name" error={errors.name?.message} required>
              <Input {...fieldAria('role-name', errors.name?.message)} aria-required autoFocus placeholder="e.g. Content Writer" {...form.register('name')} />
            </FormField>
            <FormField
              id="role-description"
              label="Description (optional)"
              error={errors.description?.message}
              hint="One line, shown when choosing a role for a user."
            >
              <Textarea
                {...fieldAria('role-description', errors.description?.message, true)}
                rows={2}
                placeholder="e.g. Writes and updates content for their clients"
                {...form.register('description')}
              />
            </FormField>
            <Controller
              control={form.control}
              name="allClients"
              render={({ field }) => (
                <SwitchRow label="Sees every client" hint="On: members see all the workspace's clients, including ones added later. Off: only the clients assigned to each user.">
                  {({ id, hintId }) => <Switch id={id} aria-describedby={hintId} checked={field.value} onCheckedChange={field.onChange} />}
                </SwitchRow>
              )}
            />
          </div>

          <SheetFooter className="flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={save.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending && <Loader2 className="animate-spin" />}
              {isEdit ? 'Save changes' : 'Add role'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
