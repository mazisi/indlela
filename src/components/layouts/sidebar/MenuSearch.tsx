import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface MenuSearchProps {
  value: string;
  onChange: (value: string) => void;
  /** Enter: open the first page that matches. */
  onSubmit: () => void;
}

/** Sidebar search: narrows the menu to the sections and pages that match. */
export function MenuSearch({ value, onChange, onSubmit }: MenuSearchProps) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onChange('');
          if (e.key === 'Enter') {
            e.preventDefault();
            onSubmit();
          }
        }}
        placeholder="Search the menu"
        aria-label="Search the menu"
        autoComplete="off"
        className="h-8 bg-card pl-8 pr-7 text-[13px] [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
          aria-label="Clear the search"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
