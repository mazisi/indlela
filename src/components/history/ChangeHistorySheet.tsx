import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import type { ResourcePage } from '@/types/pagination';
import type { ChangeEntry } from '@/types/history';
import { ChangeHistoryEntries, ChangeHistoryPager } from './ChangeHistoryList';

interface ChangeHistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** e.g. "Banks and branch codes" */
  pageTitle: string;
  history: ResourcePage<ChangeEntry> | undefined;
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  /** Column → label, e.g. { universal_branch_code: 'Universal branch code' }. */
  fieldLabels: Record<string, string>;
}

/**
 * The page-level "History" drawer (from workforce-app): who changed what on this
 * page, and when. Read-only, so unlike form drawers it may close on Escape.
 */
export function ChangeHistorySheet({
  open,
  onOpenChange,
  pageTitle,
  history,
  isPending,
  isError,
  onRetry,
  onPageChange,
  fieldLabels,
}: ChangeHistorySheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Change history</p>
          <SheetTitle className="text-lg">{pageTitle}</SheetTitle>
          <SheetDescription>Who changed what on this page, and when.</SheetDescription>
        </SheetHeader>

        <div className="relative flex-1 overflow-y-auto p-4">
          <ChangeHistoryEntries history={history} isPending={isPending} isError={isError} onRetry={onRetry} fieldLabels={fieldLabels} />
        </div>

        <ChangeHistoryPager history={history} onPageChange={onPageChange} />

        <SheetFooter className="border-t">
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
