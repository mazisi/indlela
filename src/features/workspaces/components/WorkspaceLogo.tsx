import { cn } from '@/lib/utils';
import type { WorkspaceRef } from '@/features/auth/types';

/** The workspace's logo, or its initial on the brand colour. */
export function WorkspaceLogo({ workspace, className }: { workspace: Pick<WorkspaceRef, 'name' | 'logoUrl'> | null; className?: string }) {
  if (workspace?.logoUrl) {
    return <img src={workspace.logoUrl} alt="" className={cn('size-9 shrink-0 rounded border bg-card object-contain', className)} />;
  }
  return (
    <span className={cn('flex size-9 shrink-0 items-center justify-center rounded bg-accent text-sm font-semibold text-primary', className)} aria-hidden>
      {(workspace?.name ?? '?').charAt(0).toUpperCase()}
    </span>
  );
}
