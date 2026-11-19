import { Loader2 } from 'lucide-react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useTemplatePreview } from '../hooks/useEmailTemplates';

interface Props {
  type: string;
  subject: string;
  body: string;
  buttonText: string | null;
  from: string;
}

/** The email as it will look, with sample data, following the unsaved wording. */
export function EmailPreview({ type, subject, body, buttonText, from }: Props) {
  const draftSubject = useDebouncedValue(subject, 400);
  const draftBody = useDebouncedValue(body, 400);
  const preview = useTemplatePreview(type, draftSubject, draftBody);
  const p = preview.data;

  return (
    <section aria-label="Preview with sample data" className="flex min-h-0 flex-col rounded border bg-card">
      <header className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <h3 className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Preview · sample data</h3>
        {preview.isFetching && <Loader2 className="size-3.5 animate-spin text-muted-foreground" aria-label="Updating the preview" />}
      </header>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 border-b bg-muted/30 px-3 py-2 text-xs">
        <dt className="font-semibold text-muted-foreground">From</dt>
        <dd className="truncate">{from}</dd>
        <dt className="font-semibold text-muted-foreground">Subject</dt>
        <dd className="font-medium">{p?.subject ?? '…'}</dd>
      </dl>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {preview.isError ? (
          <p className="text-sm text-bad">The preview could not be built.</p>
        ) : p ? (
          // Sanitised by the API (as when saved) before it is rendered here.
          <div className="email-body text-sm" dangerouslySetInnerHTML={{ __html: p.body }} />
        ) : (
          <p className="text-sm text-muted-foreground">Building the preview…</p>
        )}
        {buttonText && (
          <span className="mt-3 inline-block rounded bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground" aria-hidden>
            {buttonText}
          </span>
        )}
      </div>
    </section>
  );
}
