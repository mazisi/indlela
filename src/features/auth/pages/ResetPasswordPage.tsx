import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Head } from '@/components/ui/Head';
import { handleApiValidationError } from '@/utils/formErrorHandler';
import { AuthShell } from '../components/AuthShell';
import { FormAlert } from '../components/FormAlert';
import { FormField } from '../components/FormField';
import { fieldAria } from '../lib/fieldAria';
import { PasswordInput } from '../components/PasswordInput';
import { PasswordRulesChecklist } from '../components/PasswordRulesChecklist';
import { useResetPassword } from '../hooks/useAuth';
import { authErrorBody, authErrorMessage } from '../lib/authErrors';
import { resetPasswordSchema, type ResetPasswordValues } from '../schemas/authSchemas';
import type { LoginLocationState } from './LoginPage';

/**
 * Choose a new password from an emailed link. The same token flow sets the
 * first password from an invite (a user added to a workspace): /set-password,
 * or /reset-password with `invite=1`, only changes the wording.
 */
export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const invite = pathname === '/set-password' || params.get('invite') === '1';
  const title = invite ? 'Choose your password' : 'Choose a new password';
  const token = params.get('token') ?? '';
  const email = params.get('email') ?? '';

  const reset = useResetPassword();
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, email, password: '', passwordConfirmation: '' },
  });
  const { errors } = form.formState;
  const password = useWatch({ control: form.control, name: 'password' });

  if (!token || !email) {
    return (
      <AuthShell title="This link is incomplete">
        <Head title="Reset link" />
        <FormAlert tone="error">
          The link is missing information. Open it straight from the email, or ask for a new one.
        </FormAlert>
        <Button asChild size="lg">
          <Link to="/forgot-password">Ask for a new link</Link>
        </Button>
      </AuthShell>
    );
  }

  const linkDead = authErrorBody(reset.error).error_type === 'invalid_reset_token';

  const onSubmit = (values: ResetPasswordValues) => {
    reset.mutate(values, {
      onSuccess: (res) =>
        navigate('/login', { replace: true, state: { notice: res.message, email } satisfies LoginLocationState }),
      onError: (err) => {
        if ((err as { response?: { status?: number } }).response?.status === 422) {
          handleApiValidationError(err, form.setError);
        }
      },
    });
  };

  return (
    <AuthShell
      title={title}
      subtitle={
        <>
          {invite ? 'Welcome to Indlela. ' : ''}For <span className="font-medium text-foreground">{email}</span>
        </>
      }
    >
      <Head title={title} />

      {linkDead && (
        <FormAlert tone="error">
          <p>{authErrorMessage(reset.error)}</p>
          <p>
            <Link to="/forgot-password" state={{ email }}>
              Send me a new link
            </Link>
          </p>
        </FormAlert>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <FormField id="password" label={invite ? 'Password' : 'New password'} error={errors.password?.message}>
          <PasswordInput
            {...fieldAria('password', errors.password?.message)}
            autoComplete="new-password"
            autoFocus
            {...form.register('password')}
          />
        </FormField>
        <PasswordRulesChecklist password={password ?? ''} email={email} />

        <FormField id="passwordConfirmation" label={invite ? 'Confirm password' : 'Confirm new password'} error={errors.passwordConfirmation?.message}>
          <PasswordInput
            {...fieldAria('passwordConfirmation', errors.passwordConfirmation?.message)}
            autoComplete="new-password"
            {...form.register('passwordConfirmation')}
          />
        </FormField>

        <Button type="submit" size="lg" disabled={reset.isPending || linkDead}>
          {reset.isPending ? <Loader2 className="animate-spin" /> : <KeyRound />}
          {invite ? 'Save password' : 'Save new password'}
        </Button>
      </form>
    </AuthShell>
  );
}
