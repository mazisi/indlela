import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PaginatorProps {
  currentPage: number;
  lastPage: number;
  totalItems: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  /** Explicit next/prev availability (from the API); falls back to page math. */
  hasNext?: boolean;
  hasPrev?: boolean;
}

const PER_PAGE_OPTIONS = [10, 15, 20, 50, 100];

// Page numbers to show, with -1 marking an ellipsis: 1 … 4 5 6 … 20
function pageNumbers(current: number, last: number): number[] {
  const pages: number[] = [1];
  for (let i = Math.max(2, current - 1); i <= Math.min(last - 1, current + 1); i++) {
    if (pages[pages.length - 1] !== i - 1) pages.push(-1);
    pages.push(i);
  }
  if (last > 1 && pages[pages.length - 1] !== last) {
    if (pages[pages.length - 1] !== last - 1) pages.push(-1);
    pages.push(last);
  }
  return pages;
}

export function Paginator({
  currentPage,
  lastPage,
  totalItems,
  perPage,
  onPageChange,
  onPerPageChange,
  hasNext,
  hasPrev,
}: PaginatorProps) {
  const prevDisabled = hasPrev !== undefined ? !hasPrev : currentPage <= 1;
  const nextDisabled = hasNext !== undefined ? !hasNext : currentPage >= lastPage;

  // Always include the active perPage so the Select has a matching item to bind
  // to — otherwise a page whose default isn't a preset (e.g. 15) shows blank.
  const perPageOptions = PER_PAGE_OPTIONS.includes(perPage)
    ? PER_PAGE_OPTIONS
    : [...PER_PAGE_OPTIONS, perPage].sort((a, b) => a - b);

  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Per page</span>
        <Select value={String(perPage)} onValueChange={(v) => onPerPageChange(Number(v))}>
          <SelectTrigger size="sm" className="w-[72px]">
            <SelectValue />
          </SelectTrigger>
          {/* Opens upward — the paginator sits at the bottom of the list. */}
          <SelectContent side="top">
            {perPageOptions.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="whitespace-nowrap">· {totalItems} total</span>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={prevDisabled}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {pageNumbers(currentPage, lastPage).map((page, i) =>
          page === -1 ? (
            <span key={`ellipsis-${i}`} className="px-1.5 text-sm text-muted-foreground">
              …
            </span>
          ) : (
            <Button
              key={page}
              variant={page === currentPage ? 'default' : 'outline'}
              size="sm"
              className="h-8 min-w-8 px-2"
              onClick={() => onPageChange(page)}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </Button>
          ),
        )}

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={nextDisabled}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
