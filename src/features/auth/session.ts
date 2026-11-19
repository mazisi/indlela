import { useSyncExternalStore } from 'react';
import type { AccountState, AuthUser, SessionPayload, WorkspaceMembership, WorkspaceRef } from './types';

/**
 * The browser side of a signed-in session. The token in localStorage is the
 * single source of truth for "signed in": route guards, the axios client and
 * the idle timer all read it here. (bee-compliance mirrored it into Redux too;
 * the two disagreeing is what caused its /login ↔ /dashboard bounce loops, so
 * Indlela keeps exactly one copy, as workforce-app does.)
 */

export const STORAGE_KEYS = {
  token: 'indlela_auth_token',
  user: 'indlela_user',
  permissions: 'indlela_permissions',
  roles: 'indlela_roles',
  workspace: 'indlela_workspace',
  workspaces: 'indlela_workspaces',
} as const;

const EVENT = 'indlela:session';

/** Why the last session in this tab ended: decides where the guard sends the user. */
export type SessionEndReason = 'signed_out' | 'expired';
let endReason: SessionEndReason | null = null;

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value ?? null));
  } catch {
    /* storage unavailable (private mode / quota): the session lives in memory only */
  }
}

function notify(): void {
  window.dispatchEvent(new Event(EVENT));
}

export const session = {
  token: (): string | null => read<string>(STORAGE_KEYS.token),
  user: (): AuthUser | null => read<AuthUser>(STORAGE_KEYS.user),
  permissions: (): string[] | null => read<string[]>(STORAGE_KEYS.permissions),
  roles: (): string[] | null => read<string[]>(STORAGE_KEYS.roles),
  workspace: (): WorkspaceRef | null => read<WorkspaceRef>(STORAGE_KEYS.workspace),
  workspaces: (): WorkspaceMembership[] | null => read<WorkspaceMembership[]>(STORAGE_KEYS.workspaces),

  /** The cached account state, or null when any part is missing. */
  state(): AccountState | null {
    const user = this.user();
    const roles = this.roles();
    const permissions = this.permissions();
    if (!user || !roles || !permissions) return null;
    return { user, roles, permissions, workspace: this.workspace(), workspaces: this.workspaces() ?? [] };
  },

  /** Store a fresh sign-in (POST /login, /login/verify-pin or /register). */
  start(payload: SessionPayload): void {
    endReason = null;
    write(STORAGE_KEYS.token, payload.token);
    this.update(payload);
  },

  /**
   * Refresh the cached user/permissions/workspace without touching the token
   * (GET /me, or a workspace switch, which keeps the same token).
   */
  update(payload: Partial<AccountState> & Pick<AccountState, 'user' | 'roles' | 'permissions'>): void {
    write(STORAGE_KEYS.user, payload.user);
    write(STORAGE_KEYS.permissions, payload.permissions);
    write(STORAGE_KEYS.roles, payload.roles);
    if (payload.workspace !== undefined) write(STORAGE_KEYS.workspace, payload.workspace);
    if (payload.workspaces !== undefined) write(STORAGE_KEYS.workspaces, payload.workspaces);
    notify();
  },

  /**
   * End the session. `signed_out` (the user chose to) sends them to /login with
   * a notice; `expired` (idle, 401) keeps a returnUrl so they come back.
   */
  clear(reason: SessionEndReason = 'expired'): void {
    endReason = reason;
    try {
      Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    } catch {
      /* ignore */
    }
    notify();
  },

  endReason: (): SessionEndReason | null => endReason,
};

function subscribe(callback: () => void): () => void {
  window.addEventListener(EVENT, callback);
  // Another tab signing in/out changes localStorage too.
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

/** Re-renders when the session starts or ends (in this tab or another). */
export function useIsSignedIn(): boolean {
  return useSyncExternalStore(subscribe, () => session.token() !== null);
}
