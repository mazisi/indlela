import { Construction } from 'lucide-react';
import { Head } from '@/components/ui/Head';
import { PageHeader } from '@/components/page/PageHeader';
import { usePermissions } from '@/contexts/PermissionContextType';
import { ACTION_LABELS, MODULES, resourceOf, type ModuleKey } from '@/config/modules';

/**
 * Stand-in for screens not built yet. The route is already permission-guarded,
 * so reaching it proves the user's access is wired end to end.
 */
export default function ModulePlaceholder({ moduleKey, itemKey }: { moduleKey: ModuleKey; itemKey?: string }) {
  const { actionsOn } = usePermissions();
  const module = MODULES.find((m) => m.key === moduleKey)!;
  const item = module.items?.find((i) => i.key === itemKey);
  const Icon = module.icon;
  const title = item?.label ?? module.label;
  const actions = actionsOn(resourceOf(module, item));

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <Head title={title} />
      <PageHeader eyebrow={item ? module.label : undefined} title={title} actions={
          <span className="flex flex-wrap gap-1" aria-label="Your access on this page">
            {actions.map((a) => (
              <span key={a} className="rounded bg-accent px-1.5 py-0.5 text-2xs font-semibold uppercase tracking-wide text-primary">
                {ACTION_LABELS[a]}
              </span>
            ))}
          </span>
        }
      />
      <div className="flex flex-col items-center justify-center gap-3 rounded border border-dashed bg-card px-6 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-accent text-primary">
          <Icon className="size-5" aria-hidden />
        </span>
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          <Construction className="size-4 text-warn" aria-hidden />
          Coming soon
        </p>
        <p className="max-w-md text-sm text-muted-foreground">
          {title} is being built. Your access is already set up — it will appear here as soon as it goes live.
        </p>
      </div>
    </div>
  );
}
