import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Mail } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { FormField } from '@/features/auth/components/FormField';
import { fieldAria } from '@/features/auth/lib/fieldAria';
import { formatSaPhone } from '@/utils/saPhone';
import showToaster from '@/utils/showToaster';
import { handleApiValidationError } from '@/utils/formErrorHandler';
import { userFormSchema, type UserFormInput, type UserFormValues } from '../schemas/userSchemas';
import { useSaveUser, useUserOptions } from '../hooks/useUsers';
import { ClientsField, PinChannelSelect, RoleSelect } from './AccessFields';
import type { AppUser } from '../types';

interface UserFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The user to edit; omit to add one. */
  user?: AppUser;
}

const STATUSES = [
  { value: 'active', label: 'Active', hint: 'Can sign in.' },
  { value: 'disabled', label: 'Disabled', hint: 'Cannot sign in; signed out straight away.' },
  { value: 'locked', label: 'Locked', hint: 'As after 5 wrong passwords; a reset unlocks it.' },
] as const;

const EDITABLE = new Set(['active', 'disabled', 'locked']);

const EMPTY: UserFormInput = { fullName: '', surname: '', email: '', mobile: '', mfaChannel: 'email', roleId: 0, clientIds: [] };

const toForm = (user?: AppUser): UserFormInput =>
  user
    ? {
        fullName: user.fullName,
        surname: user.surname ?? '',
        email: user.email,
        mobile: formatSaPhone(user.mobile),
        mfaChannel: user.mfaChannel ?? 'email',
        roleId: user.role?.id ?? 0,
        clientIds: user.clients.map((c) => c.id),
        status: EDITABLE.has(user.status) ? (user.status as UserFormInput['status']) : undefined,
      }
    : EMPTY;

/**
 * Add a user to the workspace (a new account gets an email to choose its
 * password; an existing one is just added) or edit one, including their status. Closes via Cancel, Save, X or Escape (asked first once something changed).
 */
export function UserFormSheet({ open, onOpenChange, user }: UserFormSheetProps) {
  const isEdit = Boolean(user);
  const options = useUserOptions(open);
  const save = useSaveUser();
  const fullAccessRoleIds = (options.data?.roles ?? []).filter((r) => r.isSystem || r.allClients).map((r) => r.id);
  const form = useForm<UserFormInput, unknown, UserFormValues>({ resolver: zodResolver(userFormSchema(fullAccessRoleIds)), defaultValues: EMPTY });
  const { errors } = form.formState;
  const roleId = useWatch({ control: form.control, name: 'roleId' });

  useEffect(() => {
    if (open) form.reset(toForm(user));
  }, [open, user, form]);

  const onSubmit = async (values: UserFormValues) => {
    try {
      const input = { ...values, status: isEdit ? (values.status ?? user?.status) : undefined };
      const saved = await save.mutateAsync({ id: user?.id, input });
      showToaster('success', isEdit ? `${saved.name} saved.` : `${saved.name} added. They have been emailed about their access.`);
      onOpenChange(false);
    } catch (error) {
      handleApiValidationError(error, form.setError);
    }
  };

  // Every field built here (names and email) is required.
  const text = (name: 'fullName' | 'surname' | 'email', label: string, props: Record<string, unknown> = {}) => (
    <FormField id={`user-${name}`} label={label} error={errors[name]?.message} required>
      <Input {...fieldAria(`user-${name}`, errors[name]?.message)} aria-required {...props} {...form.register(name)} />
    </FormField>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg">
        <SheetHeader className="border-b">
          <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">User</p>
          <SheetTitle className="text-lg">{isEdit ? user?.name : 'Add user'}</SheetTitle>
          <SheetDescription>
            {isEdit ? 'Change their details, role, client access or status.' : 'Someone new chooses a password from the emailed link; an existing Indlela account is added as is.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="relative flex-1 space-y-4 overflow-y-auto p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {text('fullName', 'First name', { autoFocus: true, autoComplete: 'off' })}
              {text('surname', 'Surname', { autoComplete: 'off' })}
            </div>
            {text('email', 'Email', { type: 'email', autoComplete: 'off', placeholder: 'name@example.co.za', readOnly: user?.sharedAccount, title: user?.sharedAccount ? 'Also in another workspace: only they can change it' : undefined })}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="user-mobile" label="Cell number" error={errors.mobile?.message}>
                <Controller
                  control={form.control}
                  name="mobile"
                  render={({ field }) => (
                    <Input
                      {...fieldAria('user-mobile', errors.mobile?.message)}
                      type="tel"
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="082 555 0100"
                      value={field.value}
                      onChange={(e) => field.onChange(formatSaPhone(e.target.value))}
                      onBlur={field.onBlur}
                      ref={field.ref}
                    />
                  )}
                />
              </FormField>
              <Controller
                control={form.control}
                name="mfaChannel"
                render={({ field }) => (
                  <PinChannelSelect id="user-mfa" value={field.value} onChange={field.onChange} channels={['email', 'sms', 'off']} />
                )}
              />
            </div>

            <Controller
              control={form.control}
              name="roleId"
              render={({ field }) => (
                <RoleSelect
                  id="user-role"
                  roles={options.data?.roles ?? []}
                  value={field.value || undefined}
                  onChange={field.onChange}
                  error={errors.roleId?.message}
                />
              )}
            />

            <Controller
              control={form.control}
              name="clientIds"
              render={({ field }) => (
                <ClientsField
                  id="user-clients"
                  clients={options.data?.clients ?? []}
                  value={field.value}
                  onChange={field.onChange}
                  fullAccess={fullAccessRoleIds.includes(roleId)}
                  error={errors.clientIds?.message}
                />
              )}
            />

            {isEdit && user && EDITABLE.has(user.status) && (
              <fieldset className="space-y-1.5">
                <legend className="text-sm font-medium">Status</legend>
                {user.isYou && <p className="text-xs text-muted-foreground">You cannot disable or lock your own account.</p>}
                <Controller
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <RadioGroup value={field.value} onValueChange={field.onChange} className="grid gap-2 sm:grid-cols-3">
                      {STATUSES.map((s) => (
                        <label
                          key={s.value}
                          className="flex cursor-pointer items-start gap-2 rounded border p-2.5 text-sm has-[button[data-state=checked]]:border-primary has-[button[data-state=checked]]:bg-accent/60"
                        >
                          <RadioGroupItem value={s.value} disabled={user.isYou && s.value !== 'active'} className="mt-0.5" />
                          <span>
                            <span className="font-medium">{s.label}</span>
                            <span className="block text-xs text-muted-foreground">{s.hint}</span>
                          </span>
                        </label>
                      ))}
                    </RadioGroup>
                  )}
                />
                {errors.status && (
                  <p role="alert" className="text-xs text-destructive">
                    {errors.status.message}
                  </p>
                )}
              </fieldset>
            )}

            {!isEdit && (
              <p className="flex items-start gap-2 rounded border bg-muted/30 p-3 text-xs text-muted-foreground">
                <Mail className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                Someone new gets an email with a link to choose their password. It works once and expires after 72 hours; after that, use
                Reset password.
              </p>
            )}
          </div>

          <SheetFooter className="flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={save.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending && <Loader2 className="animate-spin" />}
              {isEdit ? 'Save changes' : 'Add user'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
