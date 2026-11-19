import * as React from "react"

import { cn } from "@/lib/utils"
import { DateInput } from "@/components/ui/date-input"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  // Dates always read dd/mm/yyyy, whatever the browser's language (Johan).
  if (type === "date") return <DateInput className={className} {...props} />
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // House input styling (w-full, gray border, h-9, rounded, navy focus).
        "input-base",
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 flex min-w-0 border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        // `!` so the invalid red border beats the unlayered `.input-base` border-gray.
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive!",
        className
      )}
      {...props}
    />
  )
}

export { Input }
