import { Link, useNavigate } from 'react-router';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Head } from '@/components/ui/Head';
import { handleApiValidationError } from '@/utils/formErrorHandler';
import { AuthShell } from '../components/AuthShell';
import { FormAlert } from '../components/FormAlert';
import { FormField } from '../components/FormField';
import { fieldAria } from '../lib/fieldAria';
import { PasswordInput } from '../components/PasswordInput';
import { PasswordRulesChecklist } from '../components/PasswordRulesChecklist';
import { useRegister } from '../hooks/useAuth';
import { authErrorMessage } from '../lib/authErrors';
import { registerSchema, type RegisterValues } from '../schemas/authSchemas';

const EMPTY: RegisterValues = { name: '', email: '', workspaceName: '', password: '', passwordConfirmation: '' };

const status = (error: unknown) => (error as { response?: { status?: number } } | null)?.response?.status;

/**
 * Workspace sign-up: the person and their agency or business. The API
 * creates the workspace with them as its Owner and signs them in straight
 * away (no approval step, unlike workforce's registration).
 */
export default function RegisterPage() {
  const navigate = useNavigate();
  const register = useRegister();

  const form = useForm<RegisterValues>({ resolver: zodResolver(registerSchema), defaultValues: EMPTY });
  const { errors } = form.formState;
  const [email, password] = useWatch({ control: form.control, name: ['email', 'password'] });

  const onSubmit = (values: RegisterValues) => {
    register.mutate(values, {
      onSuccess: () => navigate('/dashboard', { replace: true }),
      onError: (err) => {
        if (status(err) === 422) handleApiValidationError(err, form.setError);
      },
    });
  };

  return (
    <AuthShell wide title="Create your workspace" subtitle="One workspace for your agency or business: add your clients and their sites once you're in.">
      <Head title="Create your workspace" />

      {register.isError && status(register.error) !== 422 && <FormAlert tone="error">{authErrorMessage(register.error)}</FormAlert>}

      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="name" label="Your name" error={errors.name?.message} required>
            <Input {...fieldAria('name', errors.name?.message)} aria-required autoComplete="name" autoFocus {...form.register('name')} />
          </FormField>
          <FormField id="email" label="Email" error={errors.email?.message} required>
            <Input
              {...fieldAria('email', errors.email?.message)}
              aria-required
              type="email"
              autoComplete="email"
              placeholder="name@example.co.za"
              {...form.register('email')}
            />
          </FormField>
        </div>

        <FormField
          id="workspaceName"
          label="Workspace name"
          error={errors.workspaceName?.message}
          required
          hint="Your agency or business, e.g. Sandton Digital. You can change it later."
        >
          <Input
            {...fieldAria('workspaceName', errors.workspaceName?.message, true)}
            aria-required
            autoComplete="organization"
            {...form.register('workspaceName')}
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="password" label="Password" error={errors.password?.message} required>
            <PasswordInput {...fieldAria('password', errors.password?.message)} aria-required autoComplete="new-password" {...form.register('password')} />
          </FormField>
          <FormField id="passwordConfirmation" label="Confirm password" error={errors.passwordConfirmation?.message} required>
            <PasswordInput
              {...fieldAria('passwordConfirmation', errors.passwordConfirmation?.message)}
              aria-required
              autoComplete="new-password"
              {...form.register('passwordConfirmation')}
            />
          </FormField>
        </div>
        <PasswordRulesChecklist password={password ?? ''} email={email ?? ''} />

        <div className="flex flex-col-reverse items-stretch gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
            <ArrowLeft className="size-3.5" />
            I already have an account
          </Link>
          <Button type="submit" size="lg" disabled={register.isPending}>
            {register.isPending ? <Loader2 className="animate-spin" /> : <Rocket />}
            Create workspace
          </Button>
        </div>
      </form>
    </AuthShell>
  );
}
