import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { handleApiValidationError } from '@/utils/formErrorHandler';
import showToaster from '@/utils/showToaster';
import { FormField } from './FormField';
import { fieldAria } from '../lib/fieldAria';
import { PasswordInput } from './PasswordInput';
import { PasswordRulesChecklist } from './PasswordRulesChecklist';
import { useChangePassword } from '../hooks/useAuth';
import { changePasswordSchema, type ChangePasswordValues } from '../schemas/authSchemas';

export function ChangePasswordForm({ email }: { email: string }) {
  const change = useChangePassword();
  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', password: '', passwordConfirmation: '', email },
  });
  const { errors } = form.formState;
  const password = useWatch({ control: form.control, name: 'password' });

  const onSubmit = ({ currentPassword, password, passwordConfirmation }: ChangePasswordValues) => {
    change.mutate(
      { currentPassword, password, passwordConfirmation },
      {
        onSuccess: (res) => {
          showToaster('success', res.message);
          form.reset();
        },
        onError: (err) => handleApiValidationError(err, form.setError),
      },
    );
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-md space-y-4" noValidate>
      <FormField id="currentPassword" label="Current password" error={errors.currentPassword?.message}>
        <PasswordInput {...fieldAria('currentPassword', errors.currentPassword?.message)} autoComplete="current-password" {...form.register('currentPassword')} />
      </FormField>
      <FormField id="newPassword" label="New password" error={errors.password?.message}>
        <PasswordInput {...fieldAria('newPassword', errors.password?.message)} autoComplete="new-password" {...form.register('password')} />
      </FormField>
      <PasswordRulesChecklist password={password ?? ''} email={email} />
      <FormField id="passwordConfirmation" label="Confirm new password" error={errors.passwordConfirmation?.message}>
        <PasswordInput
          {...fieldAria('passwordConfirmation', errors.passwordConfirmation?.message)}
          autoComplete="new-password"
          {...form.register('passwordConfirmation')}
        />
      </FormField>
      <p className="text-xs text-muted-foreground">Changing your password signs you out on every other device.</p>
      <Button type="submit" disabled={change.isPending}>
        {change.isPending ? <Loader2 className="animate-spin" /> : <KeyRound />}
        Change password
      </Button>
    </form>
  );
}
