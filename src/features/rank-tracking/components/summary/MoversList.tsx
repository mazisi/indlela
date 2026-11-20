import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Mover } from '../../types';
import { DeviceIcon, PositionChange, Rank } from '../cells';

interface Props {
  kind: 'gains' | 'drops';
  movers: Mover[];
  onOpen: (mover: Mover) => void;
}

/** This week's biggest gains or drops: keyword, where, from → to and the change; a row opens the keyword's history. */
export function MoversList({ kind, movers, onOpen }: Props) {
  const gains = kind === 'gains';
  const Icon = gains ? TrendingUp : TrendingDown;
  const id = `rank-${kind}-title`;
  return (
    <section className="rounded border bg-card shadow-xs" aria-labelledby={id}>
      <header className="flex items-center gap-2 border-b px-4 py-2.5">
        <span className={cn('grid size-6 place-items-center rounded', gains ? 'bg-ok-soft text-ok' : 'bg-bad-soft text-bad')} aria-hidden>
          <Icon className="size-3.5" />
        </span>
        <h2 id={id} className="text-sm font-semibold">
          {gains ? 'Biggest gains' : 'Biggest drops'} this week
        </h2>
      </header>
      {movers.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">{gains ? 'No keyword moved up this week.' : 'No keyword dropped this week.'}</p>
      ) : (
        <ul className="divide-y">
          {movers.map((m) => (
            <li key={`${m.keywordId}`}>
              <button type="button" onClick={() => onOpen(m)} className="flex w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-accent/40 focus-visible:bg-accent/40 focus-visible:outline-none">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{m.keyword}</span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="truncate">{m.locationName}</span>
                    <DeviceIcon device={m.device} />
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground" aria-label={`From ${m.from ?? 'not ranking'} to ${m.to ?? 'not ranking'}`}>
                  <Rank position={m.from} className="font-normal" />
                  <ArrowRight className="size-3" aria-hidden />
                  <Rank position={m.to} className="text-foreground" />
                </span>
                <PositionChange value={m.change} context="this week" className="w-12 justify-center" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
