import * as React from "react"
import { XIcon } from "lucide-react"
import { Dialog as SheetPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog"

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

/** What counts as changing a drawer: typing, a file, ticking, toggling, choosing an option (also in a pop-up list, which React bubbles here). */
const CHANGES = '[role=checkbox],[role=switch],[role=radio],[role=option],[role=menuitemcheckbox],[role=menuitemradio]'

/** A search box only filters what is shown: typing in it changes nothing. */
const isSearch = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.matches('input[type=search]') || target.hasAttribute('cmdk-input'))

/** Marked by the innermost drawer, so a drawer opened from another doesn't make the outer one "changed". */
type Seen = Event & { wfSheetSeen?: boolean }

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  onInteractOutside,
  onEscapeKeyDown,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left"
  showCloseButton?: boolean
}) {
  // Escape closes the drawer like Cancel; once something in it was changed, it asks first.
  const changed = React.useRef(false)
  const [asking, setAsking] = React.useState(false)
  const close = React.useRef<HTMLButtonElement>(null)
  const markChanged = (event: React.SyntheticEvent) => {
    const native = event.nativeEvent as Seen
    if (native.wfSheetSeen) return
    native.wfSheetSeen = true
    if (!isSearch(event.target)) changed.current = true
  }
  const markChoice = (event: React.MouseEvent) => {
    const native = event.nativeEvent as Seen
    if (native.wfSheetSeen) return
    native.wfSheetSeen = true
    if (event.target instanceof Element && event.target.closest(CHANGES)) changed.current = true
  }

  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        // Drawers don't close on an outside click — only the X / Cancel button
        // or Escape. Guards against losing form input by clicking the backdrop.
        // A caller may still pass its own onInteractOutside; it runs after.
        onInteractOutside={(event) => {
          event.preventDefault()
          onInteractOutside?.(event)
        }}
        onEscapeKeyDown={(event) => {
          onEscapeKeyDown?.(event)
          if (event.defaultPrevented || !changed.current) return
          event.preventDefault()
          setAsking(true)
        }}
        onInputCapture={markChanged}
        onChangeCapture={markChanged}
        onClickCapture={markChoice}
        className={cn(
          // overflow-y-auto so tall drawers scroll their content; the footer
          // pins to the bottom via `sticky` (see SheetFooter).
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 overflow-y-auto shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
          side === "right" &&
            "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
          side === "left" &&
            "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
          side === "top" &&
            "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b",
          side === "bottom" &&
            "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton ? (
          <SheetPrimitive.Close ref={close} className="ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none">
            <XIcon className="size-4" />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        ) : (
          // Discard closes through the drawer's own close, so its onOpenChange runs as for X.
          <SheetPrimitive.Close ref={close} className="sr-only" tabIndex={-1} aria-hidden />
        )}
        <ConfirmationDialog
          open={asking}
          onOpenChange={setAsking}
          title="Discard your changes?"
          description="What you changed in this drawer isn’t saved. Close it anyway?"
          confirmLabel="Discard"
          cancelLabel="Keep editing"
          variant="danger"
          onConfirm={() => {
            setAsking(false)
            changed.current = false
            close.current?.click()
          }}
        />
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 p-4", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      // Sticky so the action buttons stay pinned to the bottom while the
      // content above scrolls; bg + top border keep them readable over content.
      className={cn(
        "bg-background sticky bottom-0 z-10 mt-auto flex flex-col gap-2 border-t p-4",
        className
      )}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-foreground font-semibold", className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
