import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { formatSaPhone } from '@/utils/saPhone';
import { handleApiValidationError } from '@/utils/formErrorHandler';
import showToaster from '@/utils/showToaster';
import { FormField } from './FormField';
import { fieldAria } from '../lib/fieldAria';
import { useUpdateAccount } from '../hooks/useAuth';
import { accountSchema, type AccountInput, type AccountValues } from '../schemas/authSchemas';
import type { AuthUser, MfaChannel } from '../types';

const CHANNELS: { value: MfaChannel; label: string; hint: string; adminOnly?: boolean }[] = [
  { value: 'email', label: 'Email', hint: 'Sent to your email address.' },
  { value: 'sms', label: 'SMS', hint: 'Sent to your cell number.' },
  { value: 'off', label: 'Off (not recommended)', hint: 'Password only. Workspace Owners only.', adminOnly: true },
];

/** Cell number + where the sign-in PIN goes. */
export function AccountSecurityForm({ user, isAdmin }: { user: AuthUser; isAdmin: boolean }) {
  const update = useUpdateAccount();
  const form = useForm<AccountInput, unknown, AccountValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: { mobile: formatSaPhone(user.mobile), mfaChannel: user.mfaChannel },
  });
  const { errors, isDirty } = form.formState;

  const onSubmit = (values: AccountValues) => {
    update.mutate(
      { mobile: values.mobile || undefined, mfaChannel: values.mfaChannel },
      {
        onSuccess: (res) => {
          showToaster('success', res.message);
          form.reset({ mobile: formatSaPhone(res.user.mobile), mfaChannel: res.user.mfaChannel });
        },
        onError: (err) => handleApiValidationError(err, form.setError),
      },
    );
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <FormField id="mobile" label="Cell number" error={errors.mobile?.message} className="max-w-xs">
        <Controller
          control={form.control}
          name="mobile"
          render={({ field }) => (
            <Input
              {...fieldAria('mobile', errors.mobile?.message)}
              type="tel"
              inputMode="numeric"
              placeholder="082 555 0100"
              value={field.value}
              onChange={(e) => field.onChange(formatSaPhone(e.target.value))}
              onBlur={field.onBlur}
              ref={field.ref}
            />
          )}
        />
      </FormField>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Send my one-time PIN by</legend>
        <Controller
          control={form.control}
          name="mfaChannel"
          render={({ field }) => (
            <RadioGroup value={field.value} onValueChange={field.onChange} className="grid gap-2 sm:grid-cols-3">
              {CHANNELS.filter((c) => !c.adminOnly || isAdmin || user.mfaChannel === c.value).map((c) => (
                <label
                  key={c.value}
                  htmlFor={`mfa-${c.value}`}
                  className="flex cursor-pointer items-start gap-2.5 rounded border p-3 has-[button[data-state=checked]]:border-primary has-[button[data-state=checked]]:bg-accent/60"
                >
                  <RadioGroupItem id={`mfa-${c.value}`} value={c.value} className="mt-0.5" />
                  <span>
                    <span className={`block text-sm font-medium ${c.value === 'off' ? 'text-bad' : ''}`}>{c.label}</span>
                    <span className="block text-xs text-muted-foreground">{c.hint}</span>
                  </span>
                </label>
              ))}
            </RadioGroup>
          )}
        />
        {errors.mfaChannel && <p className="text-xs text-destructive">{errors.mfaChannel.message}</p>}
      </fieldset>

      <Button type="submit" disabled={!isDirty || update.isPending}>
        {update.isPending ? <Loader2 className="animate-spin" /> : <Save />}
        Save
      </Button>
    </form>
  );
}
