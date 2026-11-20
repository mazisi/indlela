import { useId, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

/** A report section: its title over a rule in the agency's colour, or a short note when it has no figures. */
export function ReportSectionShell({
  icon: Icon,
  title,
  subtitle,
  unavailable,
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  /** Shown instead of the content (e.g. "Search Console isn't connected for this site."). */
  unavailable?: string | null;
  children?: ReactNode;
}) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="space-y-3 print:break-inside-avoid-page">
      <header className="flex items-end justify-between gap-3 border-b-2 border-(--brand-accent) pb-2">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded bg-(--brand) text-(--brand-ink) print:[print-color-adjust:exact]" aria-hidden>
            <Icon className="size-4" />
          </span>
          <h2 id={id} className="text-lg font-semibold text-foreground">
            {title}
          </h2>
        </div>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </header>
      {unavailable ? (
        <p className="flex items-start gap-2 rounded border border-dashed bg-card px-4 py-3 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          {unavailable}
        </p>
      ) : (
        children
      )}
    </section>
  );
}

/** A figure on a report: label, value and a line under it (a change, or a hint). */
export function ReportTile({ label, value, foot, className }: { label: string; value: ReactNode; foot?: ReactNode; className?: string }) {
  return (
    <div className={cn('min-w-0 rounded border bg-card px-4 py-3 shadow-xs print:break-inside-avoid', className)}>
      <p className="truncate text-2xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold leading-tight tabular-nums text-foreground">{value}</p>
      {foot && <div className="mt-1 flex min-h-5 flex-wrap items-center gap-1.5 text-xs text-muted-foreground">{foot}</div>}
    </div>
  );
}

/** A titled card inside a section (top queries, quick wins, gains…). */
export function ReportCard({ title, aside, children, className }: { title: string; aside?: ReactNode; children: ReactNode; className?: string }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className={cn('min-w-0 rounded border bg-card shadow-xs print:break-inside-avoid', className)}>
      <header className="flex items-baseline justify-between gap-2 border-b px-4 py-2.5">
        <h3 id={id} className="text-sm font-semibold">
          {title}
        </h3>
        {aside && <span className="text-xs text-muted-foreground">{aside}</span>}
      </header>
      {children}
    </section>
  );
}

export function EmptyLine({ children }: { children: ReactNode }) {
  return <p className="px-4 py-6 text-center text-sm text-muted-foreground">{children}</p>;
}

/** A titled house table (it brings its own border), or a line when there are no rows. */
export function TableBlock({ title, aside, empty, children }: { title: string; aside?: string; empty: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="min-w-0 space-y-1.5 print:break-inside-avoid">
      <header className="flex items-baseline justify-between gap-2 px-0.5">
        <h3 id={id} className="text-sm font-semibold">
          {title}
        </h3>
        {aside && <span className="text-xs text-muted-foreground">{aside}</span>}
      </header>
      {children || <p className="rounded border bg-card px-4 py-6 text-center text-sm text-muted-foreground">{empty}</p>}
    </section>
  );
}
