import type { AppUser, BulkUserAction } from '../types';

/** A step on the Users page waiting for confirmation. */
export type Confirm =
  | { kind: 'delete'; user: AppUser }
  | { kind: 'reset'; user: AppUser }
  | { kind: 'bulk'; action: 'delete' | 'disable'; ids: number[] }
  | null;

export const plural = (n: number) => `${n} ${n === 1 ? 'user' : 'users'}`;

export const BULK_DONE: Record<BulkUserAction, string> = { enable: 'enabled', disable: 'disabled', delete: 'deleted' };

/** Title, explanation and button for each confirmation. */
export function confirmText(confirm: Confirm): { title: string; description: string; confirmLabel: string } {
  if (!confirm) return { title: '', description: '', confirmLabel: 'Confirm' };
  switch (confirm.kind) {
    case 'delete':
      return {
        title: `Delete ${confirm.user.name}?`,
        description: 'They are signed out and can no longer sign in. Their history is kept. To stop access for now, disable them instead.',
        confirmLabel: 'Delete',
      };
    case 'reset':
      return {
        title: `Email a reset link to ${confirm.user.name}?`,
        description: `A single-use link to choose a new password goes to ${confirm.user.email}. Their current password keeps working until they use it.`,
        confirmLabel: 'Send link',
      };
    case 'bulk':
      return confirm.action === 'delete'
        ? {
            title: `Delete ${plural(confirm.ids.length)}?`,
            description: 'They are signed out and can no longer sign in. Their history is kept.',
            confirmLabel: 'Delete',
          }
        : {
            title: `Disable ${plural(confirm.ids.length)}?`,
            description: 'They are signed out straight away and cannot sign in until enabled again.',
            confirmLabel: 'Disable',
          };
  }
}
