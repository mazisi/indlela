import { Loader2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DEVICE_LABEL } from '../../lib/position';
import type { RankKeyword } from '../../types';

interface Props {
  keyword: RankKeyword;
  /** Why Check now can't run (paused, none left today), or null. */
  blocked: string | null;
  busy: boolean;
  onCheck: (keyword: RankKeyword) => void;
}

/**
 * A row's Check now. When it can't run, the reason shows in a tooltip; a
 * disabled button gets no pointer or focus events, so the tooltip hangs off a
 * focusable wrapper instead.
 */
export function CheckNowButton({ keyword: k, blocked, busy, onCheck }: Props) {
  const pending = k.lastCheckStatus === 'pending';
  const label = `Check now: ${k.keyword} (${k.location.name}, ${DEVICE_LABEL[k.device]})`;
  const button = (
    <Button
      variant="ghost"
      size="icon"
      className="size-6 text-primary hover:text-primary/80"
      disabled={pending || busy || Boolean(blocked)}
      onClick={() => onCheck(k)}
      aria-label={label}
      title={pending ? 'Checking…' : blocked ? undefined : 'Check now'}
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Zap className="size-3.5" />}
    </Button>
  );
  if (!blocked || pending) return button;

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0} className="inline-flex rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`${label}. ${blocked}`} data-testid="check-now-blocked">
            {button}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-60 rounded text-xs">{blocked}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
