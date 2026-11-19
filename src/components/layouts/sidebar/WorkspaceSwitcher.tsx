import { useNavigate } from 'react-router';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { usePermissions } from '@/contexts/PermissionContextType';
import { useSwitchWorkspace } from '@/features/auth/hooks/useAuth';
import { WorkspaceLogo } from '@/features/workspaces/components/WorkspaceLogo';
import showToaster from '@/utils/showToaster';
import { getApiErrorMessage } from '@/utils/formErrorHandler';

/**
 * Sidebar "Workspace" picker (replaces workforce's company switcher). A switch
 * keeps the token but replaces roles, permissions and clients, so it clears
 * the query cache and goes to the dashboard: the page on screen may not exist
 * for the new role.
 */
export function WorkspaceSwitcher({ collapsed }: { collapsed: boolean }) {
  const { workspace, workspaces } = usePermissions();
  const switcher = useSwitchWorkspace();
  const navigate = useNavigate();
  const label = workspace?.name ?? 'Workspace';

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="mx-auto flex w-fit" aria-label={`Workspace: ${label}`}>
            <WorkspaceLogo workspace={workspace} />
          </span>
        </TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  }

  const onChange = (value: string) => {
    const id = Number(value);
    if (!id || id === workspace?.id) return;
    const target = workspaces.find((w) => w.id === id);
    switcher.mutate(id, {
      onSuccess: (state) => {
        showToaster('success', `Switched to ${state.workspace?.name ?? target?.name ?? 'the workspace'}.`);
        navigate('/dashboard');
      },
      onError: (error) => showToaster('error', getApiErrorMessage(error, 'Could not switch workspace.')),
    });
  };

  return (
    <div className="space-y-1.5">
      <label htmlFor="workspace-switcher" className="flex items-center justify-between text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
        Workspace
        {switcher.isPending && <Loader2 className="size-3 animate-spin" aria-label="Switching" />}
      </label>
      <Select value={workspace ? String(workspace.id) : ''} onValueChange={onChange} disabled={workspaces.length <= 1 || switcher.isPending}>
        <SelectTrigger id="workspace-switcher" size="sm" className="w-full bg-card font-medium">
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent>
          {workspaces.map((w) => (
            <SelectItem key={w.id} value={String(w.id)}>
              <span className="truncate">{w.name}</span>
              {w.role && <span className="text-xs text-muted-foreground">· {w.role}</span>}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
