import type { ReactNode } from 'react';
import { AppToaster } from '@/components/AppToaster';
import { FileBarChart, ScanSearch, Search, TrendingUp } from 'lucide-react';
import { BrandMark } from '@/components/BrandMark';
import { version } from '../../../../package.json';

interface AuthShellProps {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  /** Wider form column, for longer forms. */
  wide?: boolean;
}

const HIGHLIGHTS = [
  { icon: Search, text: 'Search Console quick wins for every client' },
  { icon: ScanSearch, text: 'Site audits with plain-English fixes' },
  { icon: TrendingUp, text: 'Rank tracking down to the suburb' },
  { icon: FileBarChart, text: 'White-label reports your clients understand' },
];

/**
 * The sign-in frame (ported from workforce-app): a brand panel on the left,
 * the form on the right; stacked on phones. Every public auth page uses it.
 */
export function AuthShell({ title, subtitle, children, wide = false }: AuthShellProps) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4 sm:p-6">
      <div
        className={`grid w-full overflow-hidden rounded-xl border bg-card shadow-[0_1px_2px_rgba(20,35,30,.06),0_20px_50px_rgba(20,35,30,.08)] md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] ${
          wide ? 'max-w-5xl' : 'max-w-[940px]'
        }`}
      >
        <aside className="relative flex flex-col gap-6 overflow-hidden bg-brand px-6 py-7 text-white sm:px-8 sm:py-9">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-white/5"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-32 -left-20 size-80 rounded-full bg-white/5"
          />

          <BrandMark inverted />

          <div className="relative space-y-3">
            <h1 className="text-xl font-semibold leading-snug text-white">
              SEO for South African agencies and businesses
            </h1>
            <p className="text-sm leading-relaxed text-brand-foreground">
              One workspace for all your clients and their sites: see what to fix, track where you rank and report on it.
            </p>
          </div>

          <ul className="relative hidden space-y-2.5 md:block">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-brand-foreground">
                <span className="flex size-7 shrink-0 items-center justify-center rounded bg-white/10">
                  <Icon className="size-3.5 text-white" aria-hidden />
                </span>
                {text}
              </li>
            ))}
          </ul>

          <p className="relative mt-auto hidden text-2xs uppercase tracking-wider text-brand-foreground/70 md:block">
            Version {version}
          </p>
        </aside>

        <main className="flex flex-col gap-5 px-6 py-7 sm:px-9 sm:py-9">
          <header className="space-y-1">
            <h2 className="text-xl font-semibold text-foreground">{title}</h2>
            {subtitle && <div className="text-sm text-muted-foreground">{subtitle}</div>}
          </header>
          {children}
        </main>
      </div>

      <AppToaster />
    </div>
  );
}
