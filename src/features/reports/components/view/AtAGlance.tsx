import { Quote, Sparkles } from 'lucide-react';

/** The plain-language summary, the first thing the client reads, then the agency's note. */
export function AtAGlance({ summary, note, agency }: { summary: string[]; note: string | null; agency: string }) {
  return (
    <div className="space-y-3">
      <section aria-labelledby="report-glance" className="relative overflow-hidden rounded border bg-card p-5 shadow-sm print:break-inside-avoid">
        <span aria-hidden className="absolute inset-y-0 left-0 w-1.5 bg-(--brand-accent) print:[print-color-adjust:exact]" />
        <h2 id="report-glance" className="flex items-center gap-2 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Sparkles className="size-3.5 text-(--brand-accent)" aria-hidden />
          At a glance
        </h2>
        {summary.length ? (
          <ul className="mt-3 space-y-2">
            {summary.map((line) => (
              <li key={line} className="flex gap-2.5 text-base font-medium leading-snug text-foreground">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-(--brand-accent)" />
                {line}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">No headline changes this period.</p>
        )}
      </section>
      {note && (
        <section aria-label={`A note from ${agency}`} className="flex gap-3 rounded border bg-card px-5 py-4 shadow-xs print:break-inside-avoid">
          <Quote className="mt-0.5 size-4 shrink-0 text-(--brand-accent)" aria-hidden />
          <div className="min-w-0 space-y-1">
            <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">A note from {agency}</p>
            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{note}</p>
          </div>
        </section>
      )}
    </div>
  );
}
