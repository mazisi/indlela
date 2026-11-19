import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  className?: string;
  /** Marks the label with a red asterisk (pair it with `aria-required` on the control). */
  required?: boolean;
  /** Right-aligned next to the label, e.g. a "Forgot password?" link. */
  aside?: ReactNode;
  children: ReactNode;
}

/** Label + control + inline error, wired for screen readers via ids. */
export function FormField({ id, label, error, hint, className, aside, required, children }: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-0.5">
          <Label htmlFor={id} className="text-sm font-medium text-foreground">
            {label}
          </Label>
          {/* Outside the label, so the label's text (and its accessible name) stays as written. */}
          {required && (
            <span className="text-sm leading-none text-destructive" aria-hidden>
              *
            </span>
          )}
        </span>
        {aside}
      </div>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
