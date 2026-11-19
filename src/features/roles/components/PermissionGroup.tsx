import { BadgeCheck, ChevronRight, Eye, Lock, Plus, SquarePen, Trash2, type LucideIcon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { ACTION_LABELS, MODULES, type Action } from '@/config/modules';
import { cn } from '@/lib/utils';
import { checkState, permissionName, toggle } from '../lib/permissions';
import type { CatalogGroup, CatalogResource } from '../types';

const ACTION_ORDER: Action[] = ['view', 'create', 'update', 'delete', 'approve'];
const ACTION_ICONS: Record<Action, LucideIcon> = { view: Eye, create: Plus, update: SquarePen, delete: Trash2, approve: BadgeCheck };

interface PermissionGroupProps {
  group: CatalogGroup;
  held: ReadonlySet<string>;
  /** A viewer without update rights. */
  readOnly: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onChange: (next: Set<string>) => void;
}

/** Every permission name on the grantable pages of a group, optionally for one action. */
const namesIn = (resources: CatalogResource[], action?: Action) =>
  resources.flatMap((r) => r.actions.filter((a) => !action || a === action).map((a) => permissionName(a, r.key)));

/**
 * One sidebar module (bee-compliance / supplier-portal style): a header with
 * the count and "Select all", and when open a grid of its pages × actions
 * with a "Select all" row per action. Cells a page doesn't have are blank.
 */
export function PermissionGroup({ group, held, readOnly, expanded, onToggleExpand, onChange }: PermissionGroupProps) {
  const Icon = MODULES.find((m) => m.key === group.key)?.icon;
  const grantable = group.resources.filter((r) => r.grantable);
  const actions = ACTION_ORDER.filter((a) => group.resources.some((r) => r.actions.includes(a)));
  const all = namesIn(group.resources);
  const heldCount = all.filter((p) => held.has(p)).length;
  const bodyId = `perm-group-${group.key}`;

  // Select all / none for a set of pages and actions, keeping View consistent.
  const setAll = (action: Action | undefined, checked: boolean) => {
    let next = new Set(held);
    for (const r of grantable) {
      for (const a of r.actions.filter((x) => !action || x === action)) next = toggle(next, r, a, checked);
    }
    onChange(next);
  };

  return (
    <section className="rounded border bg-card">
      <div className="flex items-center gap-3 px-3 py-2">
        <button
          type="button"
          onClick={onToggleExpand}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          aria-expanded={expanded}
          aria-controls={bodyId}
        >
          <ChevronRight className={cn('size-4 shrink-0 text-muted-foreground transition-transform', expanded && 'rotate-90')} aria-hidden />
          {Icon && <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />}
          <span className="truncate text-sm font-semibold">{group.label}</span>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            ({heldCount}/{all.length})
          </span>
        </button>
        {grantable.length > 0 && (
          <label className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
            Select all
            <Checkbox
              checked={checkState(held, namesIn(grantable))}
              disabled={readOnly}
              onCheckedChange={(v) => setAll(undefined, v === true)}
              aria-label={`Select all: ${group.label}`}
            />
          </label>
        )}
      </div>

      {expanded && (
        <div id={bodyId} className="overflow-x-auto border-t">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th scope="col" className="h-8 px-3 text-left text-xs font-medium text-muted-foreground">
                  {group.label}
                </th>
                {actions.map((a) => {
                  const ActionIcon = ACTION_ICONS[a];
                  return (
                    <th key={a} scope="col" className="h-8 w-20 px-2 text-center text-xs font-medium text-muted-foreground sm:w-24">
                      <span className="inline-flex items-center gap-1">
                        <ActionIcon className="size-3.5" aria-hidden />
                        {ACTION_LABELS[a]}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {grantable.length > 1 && (
                <tr className="border-b bg-accent/50">
                  <th scope="row" className="px-3 py-1.5 text-left text-xs font-semibold text-primary">
                    Select all
                  </th>
                  {actions.map((a) => {
                    const names = namesIn(grantable, a);
                    return (
                      <td key={a} className="px-2 py-1.5 text-center">
                        {names.length > 0 && (
                          <Checkbox
                            checked={checkState(held, names)}
                            disabled={readOnly}
                            onCheckedChange={(v) => setAll(a, v === true)}
                            aria-label={`${ACTION_LABELS[a]}: every ${group.label} page`}
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              )}
              {group.resources.map((r) => (
                <tr key={r.key} className={cn('border-b last:border-b-0 hover:bg-muted/40', !r.grantable && 'bg-muted/30')}>
                  <th scope="row" className="px-3 py-1.5 text-left font-normal">
                    <span className="pl-3">{r.label}</span>
                    {!r.grantable && (
                      <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Lock className="size-3" aria-hidden />
                        Owner only
                      </span>
                    )}
                  </th>
                  {actions.map((a) => (
                    <td key={a} className="px-2 py-1.5 text-center">
                      {r.actions.includes(a) ? (
                        <Checkbox
                          checked={held.has(permissionName(a, r.key))}
                          disabled={readOnly || !r.grantable}
                          onCheckedChange={(v) => onChange(toggle(held, r, a, v === true))}
                          aria-label={`${ACTION_LABELS[a]} ${r.label}`}
                        />
                      ) : (
                        <span className="text-muted-foreground/50" aria-label="Not on this page">
                          —
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/** Collapsed group headers, as they will render. */
export function PermissionGroupsSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading permissions">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded border bg-card px-3 py-2.5">
          <Skeleton className="size-4 rounded" />
          <Skeleton className="h-3.5 w-40 rounded" />
          <Skeleton className="h-3 w-10 rounded" />
          <div className="ml-auto flex items-center gap-2">
            <Skeleton className="h-3 w-14 rounded" />
            <Skeleton className="size-4 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
