import { Menu } from 'lucide-react';
import { BrandMark } from '@/components/BrandMark';

/**
 * Phones and tablets only: the menu button and brand. On desktop the sidebar
 * carries everything (as in workforce-app), so there is no top bar.
 */
export default function Topbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-card px-4 lg:hidden">
      <button type="button" onClick={onToggleSidebar} className="rounded p-1.5 text-muted-foreground hover:bg-secondary" aria-label="Open menu">
        <Menu className="size-5" />
      </button>
      <BrandMark />
    </header>
  );
}
