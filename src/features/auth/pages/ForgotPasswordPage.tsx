import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2, MailCheck, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Head } from '@/components/ui/Head';
import { AuthShell } from '../components/AuthShell';
import { FormAlert } from '../components/FormAlert';
import { FormField } from '../components/FormField';
import { fieldAria } from '../lib/fieldAria';
import { useForgotPassword } from '../hooks/useAuth';
import { authErrorMessage } from '../lib/authErrors';
import { forgotPasswordSchema, type ForgotPasswordValues } from '../schemas/authSchemas';

export default function ForgotPasswordPage() {
  const location = useLocation();
  const prefill = (location.state as { email?: string } | null)?.email ?? '';
  const [sentTo, setSentTo] = useState<string | null>(null);

  const forgot = useForgotPassword();
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: prefill },
  });
  const { errors } = form.formState;

  const onSubmit = (values: ForgotPasswordValues) => {
    forgot.mutate(values, { onSuccess: () => setSentTo(values.email) });
  };

  if (sentTo) {
    return (
      <AuthShell title="Check your email">
        <Head title="Check your email" />
        <div className="flex items-start gap-3 rounded border bg-secondary/60 p-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded bg-ok-soft text-ok">
            <MailCheck className="size-4" aria-hidden />
          </span>
          <p className="text-sm text-muted-foreground">
            If an account exists for <span className="font-semibold text-foreground">{sentTo}</span>, a reset link is on
            its way. The link works once and expires in 30 minutes. Check your junk folder if it hasn't arrived in a few
            minutes.
          </p>
        </div>
        <Button asChild variant="outline" size="lg">
          <Link to="/login" state={{ email: sentTo }}>
            <ArrowLeft />
            Back to sign in
          </Link>
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email address. We'll send you a link to choose a new password."
    >
      <Head title="Reset your password" />

      {forgot.isError && <FormAlert tone="error">{authErrorMessage(forgot.error)}</FormAlert>}

      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <FormField id="email" label="Email" error={errors.email?.message}>
          <Input
            {...fieldAria('email', errors.email?.message)}
            type="email"
            autoComplete="email"
            autoFocus
            {...form.register('email')}
          />
        </FormField>

        <Button type="submit" size="lg" disabled={forgot.isPending}>
          {forgot.isPending ? <Loader2 className="animate-spin" /> : <Send />}
          Send reset link
        </Button>
      </form>

      <Link to="/login" className="inline-flex items-center gap-1.5 self-start text-sm text-primary hover:underline">
        <ArrowLeft className="size-3.5" />
        Back to sign in
      </Link>
    </AuthShell>
  );
}
