import { useId, type ReactNode } from 'react';

interface SwitchRowProps {
  label: ReactNode;
  hint: string;
  children: (ids: { id: string; hintId: string }) => ReactNode;
}

/** A labelled switch with a hint, in a soft panel (drawer forms). */
export function SwitchRow({ label, hint, children }: SwitchRowProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <div className="flex items-start justify-between gap-4 rounded border bg-muted/30 p-3">
      <div className="space-y-0.5">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      </div>
      {children({ id, hintId })}
    </div>
  );
}
