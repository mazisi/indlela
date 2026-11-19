import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { StickyBar } from './StickyBar';

/**
 * A page's title, eyebrow and actions. From `md` up the title row stays pinned
 * to the top while the page scrolls, so the actions stay in reach; the
 * description scrolls away, and widens with the screen (a readable line on very wide ones).
 */
export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <>
      {/* The description follows close under the title (the page's space-y gap would push it away); without one, py-2 keeps the usual gap. */}
      <StickyBar className={cn('flex flex-wrap items-end justify-between gap-3', description ? 'mb-1 md:mb-0' : 'md:mb-2')}>
        <div className="min-w-0 space-y-1">
          {eyebrow && <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">{eyebrow}</p>}
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        </div>
        {actions}
      </StickyBar>
      {description && <p className="max-w-3xl text-sm text-muted-foreground md:-mt-1 xl:max-w-5xl 2xl:max-w-7xl">{description}</p>}
    </>
  );
}
