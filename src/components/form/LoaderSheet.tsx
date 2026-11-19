import type { ReactNode } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { FormSkeleton } from '@/components/skeletons/FormSkeleton';
import { FormAlert } from '@/features/auth/components/FormAlert';

interface Props<T extends { id: number }> {
  /** The record a row action needs, or null when closed. */
  id: number | null;
  query: UseQueryResult<T>;
  onOpenChange: (open: boolean) => void;
  /** e.g. "consultation". */
  noun: string;
  /** The drawer that needs the loaded record (edit, review, complete…). */
  children: (record: T) => ReactNode;
}

/** From a list row: a loading drawer until the record is in, then the drawer that needs it. */
export function LoaderSheet<T extends { id: number }>({ id, query, onOpenChange, noun, children }: Props<T>) {
  const record = query.data;
  if (id !== null && record?.id === id) return <>{children(record)}</>;

  return (
    <Sheet open={id !== null} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle className="text-lg">{query.isError ? `The ${noun}` : `Loading the ${noun}…`}</SheetTitle>
          <SheetDescription className="sr-only">Loading</SheetDescription>
        </SheetHeader>
        {query.isError ? (
          <div className="p-4">
            <FormAlert tone="error">We could not load the {noun}.</FormAlert>
          </div>
        ) : (
          // The drawer that opens varies (edit, review, complete…), so a general form shape.
          <FormSkeleton label={`Loading the ${noun}`} rows={[{ fields: 2 }, { fields: 2 }, { fields: 1 }, { fields: 1, box: 'textarea' }]} />
        )}
      </SheetContent>
    </Sheet>
  );
}
