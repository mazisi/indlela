import * as React from 'react';
import { CalendarDays } from 'lucide-react';

import { cn } from '@/lib/utils';

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;
const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;

/** yyyy-mm-dd → dd/mm/yyyy ('' for anything else). */
export function isoToDisplay(iso: string): string {
  const m = ISO.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}

/**
 * What was typed → yyyy-mm-dd, or null when it isn't a real date. Takes
 * dd/mm/yyyy (also d/m/yyyy, with dashes or dots), ddmmyyyy, and a pasted
 * yyyy-mm-dd.
 */
export function displayToIso(text: string): string | null {
  const t = text.trim();
  const iso = ISO.exec(t);
  const dmy = iso ? null : (/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(t) ?? /^(\d{2})(\d{2})(\d{4})$/.exec(t));
  const [y, m, d] = iso ? [iso[1], iso[2], iso[3]] : dmy ? [dmy[3], dmy[2], dmy[1]] : [];
  if (!y || !m || !d) return null;
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  if (date.getUTCFullYear() !== Number(y) || date.getUTCMonth() !== Number(m) - 1 || date.getUTCDate() !== Number(d)) return null;
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

type Props = Omit<React.ComponentProps<'input'>, 'type'>;

/**
 * A date field that always reads dd/mm/yyyy (Johan). The browser's own date
 * box follows the browser's language, so on an English (US) browser it
 * showed mm/dd/yyyy and a page can't change that.
 *
 * The value stays yyyy-mm-dd on a hidden native date input, which takes the
 * name, ref, value and onChange exactly as before, so `register()`,
 * `setValue()`, `reset()` and controlled `value` / `onChange` all work
 * unchanged. The calendar button opens that input's own picker (with its
 * min / max). The text box shows dd/mm/yyyy and writes back each whole date
 * typed.
 */
export function DateInput({ className, id, name, value, defaultValue, onChange, onBlur, ref, min, max, disabled, readOnly, placeholder, ...aria }: Props) {
  const hidden = React.useRef<HTMLInputElement | null>(null);
  const [text, setText] = React.useState(() => isoToDisplay(String(value ?? defaultValue ?? '')));
  const typing = React.useRef(false);

  /** Keep the text in step when the value is set from code (setValue, reset, a controlled value). */
  const attach = React.useCallback(
    (el: HTMLInputElement | null) => {
      hidden.current = el;
      if (el && !Object.prototype.hasOwnProperty.call(el, '__dateInput')) {
        const own = Object.getOwnPropertyDescriptor(el, 'value') ?? Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!;
        Object.defineProperty(el, 'value', {
          configurable: true,
          get: () => own.get!.call(el) as string,
          set: (v: unknown) => {
            own.set!.call(el, v);
            setText(isoToDisplay(String(v ?? '')));
          },
        });
        Object.defineProperty(el, '__dateInput', { value: true });
      }
      if (typeof ref === 'function') ref(el);
      else if (ref) ref.current = el;
    },
    [ref],
  );

  /** Typed: hand the date (or '' while it isn't one) to the form as an ordinary input event. */
  const write = (iso: string) => {
    const el = hidden.current;
    if (!el || el.value === iso) return;
    typing.current = true;
    valueSetter.call(el, iso);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    typing.current = false;
  };

  return (
    <div className={cn('relative w-full', className)}>
      <input
        {...aria}
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder ?? 'dd/mm/yyyy'}
        maxLength={10}
        value={text}
        disabled={disabled}
        readOnly={readOnly}
        data-slot="input"
        className={cn(
          'input-base',
          'placeholder:text-muted-foreground flex min-w-0 border bg-transparent py-1 pr-9 pl-3 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          'aria-invalid:ring-destructive/20 aria-invalid:border-destructive!',
        )}
        onChange={(e) => {
          setText(e.target.value);
          write(e.target.value.trim() === '' ? '' : (displayToIso(e.target.value) ?? ''));
        }}
        onBlur={(e) => {
          const iso = displayToIso(e.target.value);
          if (iso) setText(isoToDisplay(iso));
          if (hidden.current) onBlur?.({ ...e, target: hidden.current, currentTarget: hidden.current, type: 'blur' } as React.FocusEvent<HTMLInputElement>);
        }}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label="Open calendar"
        disabled={disabled || readOnly}
        onClick={() => hidden.current?.showPicker?.()}
        className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 disabled:opacity-50"
      >
        <CalendarDays className="size-4" aria-hidden />
      </button>
      <input
        ref={attach}
        type="date"
        name={name}
        value={value}
        defaultValue={defaultValue}
        min={min}
        max={max}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
        onChange={(e) => {
          if (!typing.current) setText(isoToDisplay(e.target.value));
          onChange?.(e);
        }}
      />
    </div>
  );
}
