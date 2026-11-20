import { Button } from '@/components/ui/button';
import { SheetClose, SheetFooter } from '@/components/ui/sheet';

/** The footer of a drawer with nothing to save (details, history): one Close button, where a form's Cancel would be. */
export function SheetCloseFooter() {
  return (
    <SheetFooter className="flex-row justify-end">
      <SheetClose asChild>
        <Button type="button" variant="outline">
          Close
        </Button>
      </SheetClose>
    </SheetFooter>
  );
}
