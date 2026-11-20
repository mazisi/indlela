import { useState } from 'react';
import { ChevronDown, Link2Off, LogOut, Replace, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/formatDate';
import showToaster from '@/utils/showToaster';
import { getApiErrorMessage } from '@/utils/formErrorHandler';
import { useDisconnectGoogle, useUnlinkProperty } from '../hooks/useSearchConsole';
import { propertyLabel } from '../lib/properties';
import type { GoogleConnection, GscSite } from '../types';
import { LinkPropertyForm } from './LinkPropertyForm';

const STATUS = {
  active: { label: 'Connected', dot: 'bg-ok' },
  error: { label: 'Needs attention', dot: 'bg-warn' },
  revoked: { label: 'Access revoked', dot: 'bg-bad' },
} as const;

interface Props {
  connection: GoogleConnection;
  /** The site on screen; its property can be changed or unlinked from here. */
  site?: GscSite;
  canManage: boolean;
  onReconnect: () => void;
}

/** The workspace's Google account: who connected it, its state, and the site's property (change / unlink) and disconnect. */
export function GoogleAccountMenu({ connection, site, canManage, onReconnect }: Props) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState<'unlink' | 'disconnect' | null>(null);
  const [changing, setChanging] = useState(false);
  const disconnect = useDisconnectGoogle();
  const unlink = useUnlinkProperty();
  const status = STATUS[connection.status] ?? STATUS.error;
  const linked = site?.gscProperty ? propertyLabel(site.gscProperty) : null;

  const runConfirm = async () => {
    try {
      if (confirm === 'disconnect') {
        await disconnect.mutateAsync();
        showToaster('success', 'Google account disconnected.');
      } else if (confirm === 'unlink' && site) {
        await unlink.mutateAsync(site.id);
        showToaster('success', `${site.name} unlinked from Search Console.`);
      }
    } catch (error) {
      showToaster('error', getApiErrorMessage(error, 'That did not work. Please try again.'));
    }
    setConfirm(null);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-9 max-w-64 bg-card" aria-label={`Google account: ${connection.googleEmail}, ${status.label}`}>
            <span className={cn('size-2 shrink-0 rounded-full', status.dot)} aria-hidden />
            <span className="truncate">{connection.googleEmail}</span>
            <ChevronDown className="opacity-60" aria-hidden />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0">
          <div className="space-y-1 border-b p-3">
            <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Google account</p>
            <p className="truncate text-sm font-semibold">{connection.googleEmail}</p>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={cn('size-2 rounded-full', status.dot)} aria-hidden />
              {status.label}
              {connection.connectedBy && ` · by ${connection.connectedBy.name}`}
              {connection.connectedAt && ` · ${formatDate(connection.connectedAt)}`}
            </p>
            {connection.lastError && connection.status !== 'active' && <p className="text-xs text-bad">{connection.lastError}</p>}
          </div>
          {site && (
            <div className="space-y-1 border-b p-3">
              <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">{site.name}</p>
              {linked ? (
                <p className="truncate text-sm" title={site.gscProperty ?? undefined}>
                  {linked.name} <span className="text-xs text-muted-foreground">· {linked.kind}</span>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Not linked to a property</p>
              )}
            </div>
          )}
          {canManage && (
            <div className="flex flex-col p-1.5">
              {connection.status !== 'active' && (
                <MenuButton icon={RefreshCw} onClick={() => { setOpen(false); onReconnect(); }}>
                  Reconnect Google
                </MenuButton>
              )}
              {site && linked && (
                <>
                  <MenuButton icon={Replace} onClick={() => { setOpen(false); setChanging(true); }}>
                    Change property
                  </MenuButton>
                  <MenuButton icon={Link2Off} onClick={() => { setOpen(false); setConfirm('unlink'); }}>
                    Unlink property
                  </MenuButton>
                </>
              )}
              <MenuButton icon={LogOut} danger onClick={() => { setOpen(false); setConfirm('disconnect'); }}>
                Disconnect Google
              </MenuButton>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {canManage && site && (
        <Sheet open={changing} onOpenChange={setChanging}>
          <SheetContent onInteractOutside={(e) => e.preventDefault()} className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Change property</SheetTitle>
              <SheetDescription>
                Link {site.name} to another Search Console property. The data imported so far is replaced by the new property's.
              </SheetDescription>
            </SheetHeader>
            <div className="px-4">
              <LinkPropertyForm site={site} submitLabel="Save property" onLinked={() => setChanging(false)} onCancel={() => setChanging(false)} />
            </div>
          </SheetContent>
        </Sheet>
      )}

      <ConfirmationDialog
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
        variant="danger"
        title={confirm === 'disconnect' ? 'Disconnect Google?' : `Unlink ${site?.name ?? 'this site'}?`}
        description={
          confirm === 'disconnect'
            ? 'No site in this workspace will sync from Search Console until someone connects Google again. Data already imported stays.'
            : 'The link to its Search Console property is removed and all the Search Console data stored for this site is deleted. You can link it again later; the import then starts over.'
        }
        confirmLabel={confirm === 'disconnect' ? 'Disconnect' : 'Unlink and delete data'}
        isLoading={disconnect.isPending || unlink.isPending}
        onConfirm={runConfirm}
      />
    </>
  );
}

function MenuButton({ icon: Icon, danger, onClick, children }: { icon: typeof LogOut; danger?: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        danger ? 'text-bad hover:bg-bad-soft' : 'hover:bg-accent',
      )}
    >
      <Icon className="size-4" aria-hidden />
      {children}
    </button>
  );
}
