import type { ReactNode } from 'react';
import { useStuck } from '@/hooks/useStuck';
import { cn } from '@/lib/utils';

/**
 * A page's top bar that stays pinned while the page scrolls, from `md` up
 * (on phones its buttons wrap onto several rows, so it scrolls with the page).
 * Pinned, it spans the page's own padding (p-4 sm:p-6) and gets a border and
 * a shadow. Used by PageHeader, and by views with their own header (an open statement).
 */
export function StickyBar({ children, className }: { children: ReactNode; className?: string }) {
  const { ref, stuck } = useStuck<HTMLDivElement>();

  return (
    <div
      ref={ref}
      data-stuck={stuck || undefined}
      className={cn(
        // -1px so useStuck can tell it is pinned; -mt-2 / py-2 keep its place at rest.
        'md:sticky md:top-[-1px] md:z-20 md:-mx-6 md:-mt-2 md:border-b md:border-transparent md:bg-background md:px-6 md:py-2 md:transition-shadow',
        'md:data-[stuck]:border-border md:data-[stuck]:shadow-sm',
        className,
      )}
    >
      {children}
    </div>
  );
}
