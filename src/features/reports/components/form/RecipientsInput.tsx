import { useState, type ClipboardEvent, type KeyboardEvent } from 'react';
import { Mail, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MAX_RECIPIENTS } from '../../lib/schedule';
import { isEmail } from '../../schemas/recipients';

interface Props {
  id: string;
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  /** The form's error for the whole list. */
  error?: string;
  hint?: string;
  max?: number;
  required?: boolean;
  disabled?: boolean;
}

/** Splits "a@x.co.za, b@y.com; c@z.com" (or one per line) into addresses. */
const split = (text: string) =>
  text
    .split(/[\s,;]+/)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

/**
 * Email addresses as chips: type one and press Enter, comma or Tab (or
 * paste a list); Backspace in the empty box removes the last. A typo is
 * kept in the box with a message rather than added.
 */
export function RecipientsInput({ id, label, value, onChange, error, hint, max = MAX_RECIPIENTS, required, disabled }: Props) {
  const [draft, setDraft] = useState('');
  const [draftError, setDraftError] = useState<string>();
  const shownError = draftError ?? error;
  const full = value.length >= max;

  /** Adds what was typed; returns false (and says why) when something couldn't be added. */
  const commit = (text: string): boolean => {
    const typed = split(text);
    if (typed.length === 0) return true;
    const bad = typed.filter((t) => !isEmail(t));
    const fresh = typed.filter((t) => isEmail(t) && !value.includes(t)).filter((t, i, all) => all.indexOf(t) === i);
    const room = Math.max(0, max - value.length);
    const added = fresh.slice(0, room);
    if (added.length) onChange([...value, ...added]);
    if (bad.length) {
      setDraft(bad.join(', '));
      setDraftError(`“${bad[0]}” isn't a valid email address.`);
      return false;
    }
    setDraft('');
    if (fresh.length > room) {
      setDraftError(`Add at most ${max} email addresses.`);
      return false;
    }
    setDraftError(undefined);
    return true;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ';' || (e.key === 'Tab' && draft.trim())) {
      // Enter must not submit the drawer's form.
      e.preventDefault();
      commit(draft);
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text');
    if (!/[\s,;]/.test(text.trim())) return;
    e.preventDefault();
    commit(`${draft} ${text}`);
  };

  const remove = (email: string) => {
    onChange(value.filter((v) => v !== email));
    setDraftError(undefined);
  };

  const describedBy = [shownError ? `${id}-error` : null, hint && !shownError ? `${id}-hint` : null, `${id}-count`].filter(Boolean).join(' ');

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-0.5">
          <label htmlFor={id} className="text-sm font-medium text-foreground">
            {label}
          </label>
          {required && (
            <span className="text-sm leading-none text-destructive" aria-hidden>
              *
            </span>
          )}
        </span>
        <span id={`${id}-count`} className="text-xs tabular-nums text-muted-foreground">
          {value.length} of {max}
        </span>
      </div>
      <div
        className={cn(
          'flex min-h-9 flex-wrap items-center gap-1.5 rounded border bg-card px-2 py-1.5 shadow-xs transition-colors focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50',
          shownError && 'border-destructive',
          disabled && 'opacity-60',
        )}
        onClick={(e) => (e.currentTarget.querySelector('input') as HTMLInputElement | null)?.focus()}
      >
        <ul className="contents" aria-label={`${label}: ${value.length} added`}>
          {value.map((email) => (
            <li key={email} className="inline-flex max-w-full items-center gap-1 rounded border bg-accent/60 py-0.5 pl-1.5 pr-0.5 text-xs font-medium text-foreground">
              <Mail className="size-3 shrink-0 text-primary" aria-hidden />
              <span className="truncate">{email}</span>
              <button
                type="button"
                onClick={() => remove(email)}
                disabled={disabled}
                className="grid size-4 place-items-center rounded text-muted-foreground hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Remove ${email}`}
              >
                <X className="size-3" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
        <input
          id={id}
          type="email"
          inputMode="email"
          autoComplete="off"
          value={draft}
          disabled={disabled || full}
          placeholder={full ? `${max} added (the most)` : value.length ? 'Add another' : 'name@client.co.za'}
          aria-invalid={shownError ? true : undefined}
          aria-describedby={describedBy}
          onChange={(e) => {
            setDraft(e.target.value);
            if (draftError) setDraftError(undefined);
          }}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          onBlur={() => commit(draft)}
          className="h-6 min-w-40 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        />
      </div>
      {hint && !shownError && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {shownError && (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {shownError}
        </p>
      )}
    </div>
  );
}
