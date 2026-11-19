import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Head } from '@/components/ui/Head';
import { resolvePostLoginDestination } from '@/utils/returnUrl';
import { AuthShell } from '../components/AuthShell';
import { FormAlert } from '../components/FormAlert';
import { FormField } from '../components/FormField';
import { fieldAria } from '../lib/fieldAria';
import { PasswordInput } from '../components/PasswordInput';
import { PinStep } from '../components/PinStep';
import { useLogin } from '../hooks/useAuth';
import { authErrorBody, authErrorMessage } from '../lib/authErrors';
import { loginSchema, type LoginValues } from '../schemas/authSchemas';
import type { PinChallenge, SignedIn } from '../types';

/** Flash messages other pages hand to /login via router state. */
export interface LoginLocationState {
  notice?: string;
  email?: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as LoginLocationState;

  const [challenge, setChallenge] = useState<PinChallenge | null>(null);
  const [error, setError] = useState<{ message: string; locked: boolean } | null>(null);
  // Derived from the current location, not snapshotted at mount: sign-out can
  // land here twice (guard redirect, then the navigate carrying the notice)
  // without remounting this page. Dismissed per history entry.
  const [dismissedNoticeFor, setDismissedNoticeFor] = useState<string | null>(null);
  const notice = dismissedNoticeFor === location.key ? null : (state.notice ?? null);

  const login = useLogin();
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: state.email ?? '', password: '' },
  });
  const { errors } = form.formState;

  const finish = (_result: SignedIn) => {
    navigate(resolvePostLoginDestination(location.search), { replace: true });
  };

  const onSubmit = (values: LoginValues) => {
    setError(null);
    setDismissedNoticeFor(location.key);
    login.mutate(values, {
      onSuccess: (result) => (result.requiresMfa ? setChallenge(result) : finish(result)),
      onError: (err) => {
        form.setValue('password', '');
        const body = authErrorBody(err);
        setError({ message: authErrorMessage(err), locked: body.error_type === 'account_locked' });
        form.setFocus('password');
      },
    });
  };

  if (challenge) {
    return (
      <AuthShell title="Enter your one-time PIN" subtitle="One more step to keep your account safe.">
        <Head title="Verify sign-in" />
        <PinStep
          challenge={challenge}
          onSignedIn={finish}
          onRestart={(message) => {
            setChallenge(null);
            form.setValue('password', '');
            if (message) setError({ message, locked: false });
          }}
        />
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Sign in" subtitle="Use the email address you signed up with.">
      <Head title="Sign in" />

      {notice && <FormAlert tone="success">{notice}</FormAlert>}
      {error && (
        <FormAlert tone="error">
          <p>{error.message}</p>
          {error.locked && (
            <p>
              <Link to="/forgot-password" state={{ email: form.getValues('email') }}>
                Reset your password
              </Link>{' '}
              to unlock it now.
            </p>
          )}
        </FormAlert>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <FormField id="email" label="Email" error={errors.email?.message}>
          <Input
            {...fieldAria('email', errors.email?.message)}
            type="email"
            autoComplete="username"
            autoFocus={!state.email}
            {...form.register('email')}
          />
        </FormField>

        <FormField
          id="password"
          label="Password"
          error={errors.password?.message}
          aside={
            <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          }
        >
          <PasswordInput
            {...fieldAria('password', errors.password?.message)}
            autoComplete="current-password"
            autoFocus={!!state.email}
            {...form.register('password')}
          />
        </FormField>

        <Button type="submit" size="lg" className="mt-1" disabled={login.isPending}>
          {login.isPending ? <Loader2 className="animate-spin" /> : <LogIn />}
          Sign in
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        New to Indlela?{' '}
        <Link to="/register" className="font-medium text-primary hover:underline">
          Create your workspace
        </Link>
      </p>
    </AuthShell>
  );
}
