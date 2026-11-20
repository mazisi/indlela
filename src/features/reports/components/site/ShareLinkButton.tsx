import { useState } from 'react';
import { Link2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { ReportRow, ShareExpiry } from '../../types';

const EXPIRY: { value: string; days: ShareExpiry; label: string }[] = [
  { value: '7', days: 7, label: '7 days' },
  { value: '30', days: 30, label: '30 days' },
  { value: '90', days: 90, label: '90 days' },
  { value: 'never', days: null, label: 'Never' },
];

interface Props {
  report: ReportRow;
  busy: boolean;
  onCopy: (expiresInDays?: ShareExpiry) => Promise<boolean>;
  /** A row's icon button, or a labelled button (the preview's action bar). */
  variant?: 'icon' | 'button';
}

/**
 * Copy the report's share link. With no link yet, a small popover asks how
 * long the new one should work, then creates and copies it.
 */
export function ShareLinkButton({ report, busy, onCopy, variant = 'icon' }: Props) {
  const [open, setOpen] = useState(false);
  const [expiry, setExpiry] = useState('30');
  const label = report.share ? 'Copy share link' : 'Create share link';

  // With a link already, the button copies it straight away.
  const onClick = report.share ? () => void onCopy() : undefined;
  const trigger =
    variant === 'icon' ? (
      <Button variant="ghost" size="icon" className="size-6 text-primary hover:text-primary/80" aria-label={`${label} for ${report.title}`} title={label} disabled={busy} onClick={onClick}>
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Link2 className="size-3.5" />}
      </Button>
    ) : (
      <Button variant="outline" disabled={busy} onClick={onClick}>
        {busy ? <Loader2 className="animate-spin" /> : <Link2 />}
        {report.share ? 'Copy link' : 'Share'}
      </Button>
    );

  if (report.share) return trigger;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-3" onClick={(e) => e.stopPropagation()}>
        <p className="text-sm font-semibold">Create a share link</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Anyone with the link sees the report with your branding, without signing in.</p>
        <fieldset className="mt-3">
          <legend className="mb-1.5 text-xs font-medium text-muted-foreground">Link works for</legend>
          <RadioGroup value={expiry} onValueChange={setExpiry} aria-label="Link works for" className="grid grid-cols-2 gap-1.5">
            {EXPIRY.map((o) => (
              <label key={o.value} htmlFor={`share-${report.id}-${o.value}`} className="flex cursor-pointer items-center gap-2 rounded border px-2 py-1.5 text-sm has-[[data-state=checked]]:border-primary/50 has-[[data-state=checked]]:bg-accent/50">
                <RadioGroupItem id={`share-${report.id}-${o.value}`} value={o.value} />
                {o.label}
              </label>
            ))}
          </RadioGroup>
        </fieldset>
        <Button
          className="mt-3 w-full"
          size="sm"
          disabled={busy}
          onClick={async () => {
            const days = EXPIRY.find((o) => o.value === expiry)?.days ?? null;
            if (await onCopy(days)) setOpen(false);
          }}
        >
          {busy ? <Loader2 className="animate-spin" /> : <Link2 />}
          Create and copy link
        </Button>
      </PopoverContent>
    </Popover>
  );
}
