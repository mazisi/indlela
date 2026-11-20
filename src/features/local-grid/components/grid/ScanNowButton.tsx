import { Loader2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * Scan now on the grid page. When it can't run the reason shows in a
 * tooltip; a disabled button gets no pointer or focus events, so the tooltip
 * hangs off a focusable wrapper.
 */
export function ScanNowButton({ blocked, busy, onScan }: { blocked: string | null; busy: boolean; onScan: () => void }) {
  const button = (
    <Button onClick={onScan} disabled={busy || Boolean(blocked)}>
      {busy ? <Loader2 className="animate-spin" /> : <Zap />}
      Scan now
    </Button>
  );
  if (!blocked) return button;
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0} className="inline-flex rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Scan now. ${blocked}`} data-testid="scan-now-blocked">
            {button}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-60 rounded text-xs">{blocked}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
