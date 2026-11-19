import type { AuthUser } from '../types';

export function initials(user: Pick<AuthUser, 'fullName' | 'surname'>): string {
  return `${user.fullName.charAt(0)}${(user.surname ?? '').charAt(0)}`.toUpperCase() || '?';
}

/** "All clients" or "Acme, Bosveld Foods": the clients a user works on. */
export function clientScopeLabel(user: Pick<AuthUser, 'seesAllClients' | 'clients'>): string {
  if (user.seesAllClients) return 'All clients';
  if (user.clients.length === 0) return 'No clients assigned';
  return user.clients.map((c) => c.name).join(', ');
}
