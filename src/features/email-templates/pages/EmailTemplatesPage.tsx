import { useState } from 'react';
import { Loader2, Mail, Send } from 'lucide-react';
import { Head } from '@/components/ui/Head';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page/PageHeader';
import { DataTable, DataTableSkeleton, type DataColumn } from '@/components/table/DataTable';
import { FormAlert } from '@/features/auth/components/FormAlert';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/utils/formatDate';
import showToaster from '@/utils/showToaster';
import { getApiErrorMessage } from '@/utils/formErrorHandler';
import { useSendTest, useTemplates } from '../hooks/useEmailTemplates';
import { TemplateSheet } from '../components/TemplateSheet';
import type { EmailTemplate } from '../types';

type Row = EmailTemplate & { id: number };

const pill = 'inline-flex whitespace-nowrap rounded px-1.5 py-0.5 text-2xs font-semibold';

const COLUMNS: DataColumn<Row, never>[] = [
  {
    label: 'Email',
    skeleton: 'w-48',
    className: 'whitespace-normal',
    cell: (t) => (
      <span className="flex max-w-md flex-col">
        <span className="font-semibold">{t.label}</span>
        <span className="text-xs text-muted-foreground">{t.description}</span>
      </span>
    ),
  },
  { label: 'Goes to', skeleton: 'w-24', cell: (t) => <span className="text-xs text-muted-foreground">{t.directRecipient ?? 'The person concerned'}</span> },
  {
    label: 'Subject',
    skeleton: 'w-48',
    wideOnCard: true,
    className: 'whitespace-normal md:w-80',
    cell: (t) => <span className="line-clamp-2 max-w-sm break-words font-mono text-2xs text-muted-foreground">{t.subject}</span>,
  },
  {
    label: 'Wording',
    skeleton: 'w-16',
    className: 'md:w-32',
    cell: (t) =>
      t.isCustomised ? (
        <span className={cn(pill, 'bg-accent text-primary')} title={t.updatedAt ? `Changed ${formatDateTime(t.updatedAt)}` : undefined}>
          Customised
        </span>
      ) : (
        <span className={cn(pill, 'bg-secondary text-muted-foreground')}>Default</span>
      ),
  },
];

/**
 * Settings › Email templates (ported from workforce-app's Email
 * notifications, without recipients, on/off or sent emails): the wording of
 * every email Indlela sends, with a live preview and a test to yourself.
 */
export default function EmailTemplatesPage() {
  const query = useTemplates();
  const d = query.data;
  const [editing, setEditing] = useState<string | null>(null);
  const test = useSendTest();
  const open = d?.data.find((t) => t.type === editing);
  const rows: Row[] = (d?.data ?? []).map((t, i) => ({ ...t, id: i }));

  const onTest = async (t: EmailTemplate) => {
    try {
      showToaster('success', (await test.mutateAsync(t.type)).message);
    } catch (error) {
      showToaster('error', getApiErrorMessage(error, 'The test email could not be sent.'));
    }
  };

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <Head title="Email templates" />
      <PageHeader
        eyebrow="Settings"
        title="Email templates"
        description="The wording of every email Indlela sends for this workspace: sign-in PINs, password resets and invitations. Placeholders are filled in when an email is sent."
      />

      {d && (
        <p className="text-sm text-muted-foreground">
          Sent from <span className="font-medium text-foreground">{d.mail.fromName}</span> &lt;{d.mail.fromAddress}&gt;
        </p>
      )}

      {query.isError ? (
        <FormAlert tone="error">
          <p>{getApiErrorMessage(query.error, 'We could not load the email templates.')}</p>
          <p>
            <button type="button" className="font-medium underline" onClick={() => query.refetch()}>
              Try again
            </button>
          </p>
        </FormAlert>
      ) : !d ? (
        <DataTableSkeleton columns={COLUMNS} rows={4} label="Loading the email templates" selectable={false} />
      ) : d.data.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded border border-dashed bg-card px-6 py-12 text-center">
          <Mail className="size-6 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">No emails.</p>
        </div>
      ) : (
        <DataTable
          rows={rows}
          columns={COLUMNS}
          noun="emails"
          rowLabel={(t) => t.label}
          onRowClick={(t) => setEditing(t.type)}
          actions={{
            onEdit: (t) => setEditing(t.type),
            extra: d.can.update
              ? (t) => (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 text-primary hover:text-primary/80"
                    onClick={() => void onTest(t)}
                    disabled={test.isPending && test.variables === t.type}
                    aria-label={`Send a test of ${t.label}`}
                    title="Send a test to yourself"
                  >
                    {test.isPending && test.variables === t.type ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                  </Button>
                )
              : undefined,
          }}
        />
      )}

      {open && d && <TemplateSheet key={open.type} template={open} page={d} onOpenChange={(o) => !o && setEditing(null)} />}
    </div>
  );
}
