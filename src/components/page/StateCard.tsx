import { useId, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/** A page's non-data state (empty, setup, not found): an icon, a title, a line of text and whatever comes next. */
export function StateCard({ icon: Icon, tone = 'primary', title, children, className }: { icon: LucideIcon; tone?: 'primary' | 'bad'; title: string; children: ReactNode; className?: string }) {
  const id = useId();
  return (
    <section className={cn('rounded border bg-card px-6 py-10 shadow-xs sm:px-10', className)} aria-labelledby={id}>
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <span className={cn('flex size-12 items-center justify-center rounded-full', tone === 'bad' ? 'bg-bad-soft text-bad' : 'bg-accent text-primary')}>
          <Icon className="size-5" aria-hidden />
        </span>
        <h2 id={id} className="mt-3 text-lg font-semibold">
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
}

/** A grid of "what you get" points under a state card's text. */
export function StateCardPoints({ points }: { points: { icon: LucideIcon; title: string; text: string }[] }) {
  return (
    <ul className="mt-6 grid w-full gap-3 text-left sm:grid-cols-2">
      {points.map(({ icon: Icon, title, text }) => (
        <li key={title} className="flex gap-3 rounded border bg-background/60 p-3">
          <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <span>
            <span className="block text-sm font-semibold">{title}</span>
            <span className="block text-xs text-muted-foreground">{text}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
