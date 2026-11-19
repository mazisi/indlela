import type { ClientRef, MfaChannel } from '@/features/auth/types';
import type { ResourcePage } from '@/types/pagination';

/** Mirrors indlela-api's App\Enums\LoginEventType values. */
export type LoginEventType =
  | 'signed_in'
  | 'signed_out'
  | 'unknown_user'
  | 'wrong_password'
  | 'account_locked'
  | 'blocked_status'
  | 'pin_sent'
  | 'wrong_pin'
  | 'pin_expired'
  | 'registered'
  | 'reset_requested'
  | 'password_reset'
  | 'password_changed'
  | 'unlocked'
  | 'created'
  | 'disabled'
  | 'enabled'
  | 'switched_workspace';

export interface LoginEvent {
  id: number;
  at: string;
  email: string;
  /** Null when no account matched (e.g. an unknown email). */
  user: string | null;
  event: LoginEventType;
  eventLabel: string;
  note: string | null;
  ipAddress: string | null;
}

export type { ResourcePage } from '@/types/pagination';

export interface LoginHistoryQuery {
  page: number;
  perPage: number;
  search?: string;
  event?: LoginEventType;
}

export type UserStatus = 'active' | 'locked' | 'disabled';

/** A row in Settings › Users and access (the API's UserResource). */
export interface AppUser {
  id: number;
  fullName: string;
  surname: string;
  name: string;
  email: string;
  mobile: string | null;
  /** The role in the current workspace; `allClients` roles see every client. */
  role: { id: number; name: string; isSystem: boolean; allClients: boolean } | null;
  /** Assigned clients (client access); empty for roles that see every client. */
  clients: ClientRef[];
  mfaChannel: MfaChannel | null;
  status: UserStatus;
  statusLabel: string;
  lockedAt: string | null;
  lastLoginAt: string | null;
  /** Also in another workspace: account details and status are theirs to change. */
  sharedAccount?: boolean;
  /** The signed-in Owner's own row. */
  isYou: boolean;
}

export interface UsersQuery {
  page: number;
  perPage: number;
  search?: string;
  status?: UserStatus;
}

export interface UsersPage extends ResourcePage<AppUser> {
  /** Users per status, for the tabs (ignores the status filter). */
  summary: Record<'all' | UserStatus, number>;
}

export interface UserRoleOption {
  id: number;
  name: string;
  description: string | null;
  isSystem: boolean;
  /** Sees every client: no client access to tick. */
  allClients: boolean;
}

export interface UserOptions {
  roles: UserRoleOption[];
  clients: ClientRef[];
}

export interface UserInput {
  fullName: string;
  surname: string;
  email: string;
  mobile: string;
  mfaChannel: MfaChannel;
  roleId: number;
  clientIds: number[];
  /** Edit only. */
  status?: UserStatus;
}

export type BulkUserAction = 'enable' | 'disable' | 'delete';
