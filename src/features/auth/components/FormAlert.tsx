import type { ReactNode } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

const TONES = {
  error: { box: 'border-bad/30 bg-bad-soft text-bad', icon: AlertCircle, role: 'alert' },
  success: { box: 'border-ok/30 bg-ok-soft text-ok', icon: CheckCircle2, role: 'status' },
  info: { box: 'border-primary/25 bg-accent text-primary', icon: Info, role: 'status' },
  warning: { box: 'border-warn/30 bg-warn-soft text-warn', icon: AlertTriangle, role: 'status' },
} as const;

export function FormAlert({ tone, children }: { tone: keyof typeof TONES; children: ReactNode }) {
  const { box, icon: Icon, role } = TONES[tone];
  return (
    <div role={role} className={`flex items-start gap-2.5 rounded border px-3 py-2.5 text-sm ${box}`}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1 space-y-1 [&_a]:font-medium [&_a]:underline">{children}</div>
    </div>
  );
}
