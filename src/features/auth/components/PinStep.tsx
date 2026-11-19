import { useState } from 'react';
import { Loader2, Mail, MessageSquareText, ShieldCheck } from 'lucide-react';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp';
import { FormAlert } from './FormAlert';
import { useResendPin, useVerifyPin } from '../hooks/useAuth';
import { useCountdown } from '../hooks/useCountdown';
import { authErrorBody, authErrorMessage } from '../lib/authErrors';
import type { PinChallenge, SignedIn } from '../types';

interface PinStepProps {
  challenge: PinChallenge;
  onSignedIn: (result: SignedIn) => void;
  /** Challenge closed (too many tries, too old): back to the password step. */
  onRestart: (message: string) => void;
}

const formatClock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

/**
 * Second sign-in step: the 6-digit one-time PIN (5 minutes, 3 tries). Submits
 * itself when the sixth digit is typed or pasted.
 */
export function PinStep({ challenge: initial, onSignedIn, onRestart }: PinStepProps) {
  const [challenge, setChallenge] = useState(initial);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [resendAt, setResendAt] = useState(() => Date.now() + initial.resendAvailableIn * 1000);

  const verify = useVerifyPin();
  const resend = useResendPin();
  const expiresIn = useCountdown(new Date(challenge.expiresAt).getTime());
  const resendIn = useCountdown(resendAt);
  const expired = expiresIn === 0;

  const submit = (value: string) => {
    if (value.length !== 6 || verify.isPending) return;
    setError(null);
    setNotice(null);
    verify.mutate(
      { challengeToken: challenge.challengeToken, code: value },
      {
        onSuccess: (result) => {
          if (!result.requiresMfa) onSignedIn(result);
        },
        onError: (err) => {
          const body = authErrorBody(err);
          setCode('');
          if (body.error_type === 'challenge_closed') {
            onRestart(authErrorMessage(err));
            return;
          }
          const left = body.attempts_left;
          setError(
            left !== undefined
              ? `${authErrorMessage(err)} ${left} ${left === 1 ? 'try' : 'tries'} left.`
              : authErrorMessage(err),
          );
        },
      },
    );
  };

  const requestNewCode = () => {
    setError(null);
    resend.mutate(
      { challengeToken: challenge.challengeToken },
      {
        onSuccess: (sent) => {
          setChallenge((c) => ({ ...c, destination: sent.destination, expiresAt: sent.expiresAt }));
          setResendAt(Date.now() + sent.resendAvailableIn * 1000);
          setCode('');
          setNotice('A new code is on its way. Any earlier code no longer works.');
        },
        onError: (err) => {
          const body = authErrorBody(err);
          if (body.error_type === 'challenge_closed') {
            onRestart(authErrorMessage(err));
            return;
          }
          if (body.retry_after) setResendAt(Date.now() + body.retry_after * 1000);
          setError(authErrorMessage(err));
        },
      },
    );
  };

  const ChannelIcon = challenge.channel === 'sms' ? MessageSquareText : Mail;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3 rounded border bg-secondary/60 px-3.5 py-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded bg-accent text-primary">
          <ChannelIcon className="size-4" aria-hidden />
        </span>
        <p className="text-sm text-muted-foreground">
          We sent a 6-digit code {challenge.channel === 'sms' ? 'by SMS to' : 'to'}{' '}
          <span className="font-mono font-semibold text-foreground">{challenge.destination}</span>.{' '}
          {expired ? (
            <span className="font-medium text-bad">It has expired.</span>
          ) : (
            <>
              It expires in <span className="font-mono tabular-nums text-foreground">{formatClock(expiresIn)}</span>.
            </>
          )}
        </p>
      </div>

      {notice && <FormAlert tone="success">{notice}</FormAlert>}
      {expired && !error && (
        <FormAlert tone="error">The code has expired. Send a new code to carry on.</FormAlert>
      )}

      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit(code);
        }}
      >
        <div className="space-y-2">
          <label htmlFor="pin" className="text-sm font-medium">
            One-time PIN
          </label>
          <InputOTP
            id="pin"
            maxLength={6}
            pattern={REGEXP_ONLY_DIGITS}
            value={code}
            onChange={(value) => {
              setCode(value);
              if (error) setError(null);
            }}
            onComplete={submit}
            disabled={verify.isPending || expired}
            autoFocus
            autoComplete="one-time-code"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'pin-error' : undefined}
            containerClassName="justify-center sm:justify-start"
          >
            <InputOTPGroup>
              {[0, 1, 2].map((i) => (
                <InputOTPSlot key={i} index={i} className="size-11 font-mono text-lg" />
              ))}
            </InputOTPGroup>
            <InputOTPSeparator className="text-muted-foreground" />
            <InputOTPGroup>
              {[3, 4, 5].map((i) => (
                <InputOTPSlot key={i} index={i} className="size-11 font-mono text-lg" />
              ))}
            </InputOTPGroup>
          </InputOTP>
          {error && (
            <p id="pin-error" role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}
        </div>

        <Button type="submit" size="lg" disabled={code.length !== 6 || verify.isPending || expired}>
          {verify.isPending ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
          Verify and sign in
        </Button>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <Button
          type="button"
          variant="link"
          className="h-auto p-0"
          onClick={requestNewCode}
          disabled={resendIn > 0 || resend.isPending}
        >
          {resend.isPending ? 'Sending…' : resendIn > 0 ? `Send a new code in ${resendIn}s` : 'Send a new code'}
        </Button>
        <Button type="button" variant="link" className="h-auto p-0 text-muted-foreground" onClick={() => onRestart('')}>
          Back to sign in
        </Button>
      </div>
    </div>
  );
}
