/**
 * Shapes returned by indlela-api's auth endpoints, after the axios client's
 * snake_case → camelCase transform.
 */

export type MfaChannel = 'email' | 'sms' | 'off';

/** A client of the current workspace, as the user and the pickers see it. */
export interface ClientRef {
  id: number;
  name: string;
}

/** The current workspace (agency or business). */
export interface WorkspaceRef {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  /** #rrggbb for client reports and share links; null = the default. */
  brandColor?: string | null;
}

/** A workspace the user belongs to, with their role there (the switcher's list). */
export interface WorkspaceMembership extends WorkspaceRef {
  role: string | null;
}

export interface AuthUser {
  id: number;
  name: string;
  fullName: string;
  surname: string;
  email: string;
  mobile: string | null;
  mfaChannel: MfaChannel;
  /** The role in the current workspace. */
  role: string | null;
  previousLoginAt: string | null;
  currentWorkspaceId?: number | null;
  /** The role sees every client of the workspace (Owner, or a role with `all_clients`). */
  seesAllClients: boolean;
  clients: ClientRef[];
}

/**
 * What the browser keeps about the signed-in user: GET /me, the login
 * response without the token, and the body of a workspace switch. Roles and
 * permissions are the current workspace's.
 */
export interface AccountState {
  user: AuthUser;
  roles: string[];
  permissions: string[];
  workspace: WorkspaceRef | null;
  workspaces: WorkspaceMembership[];
}

export interface SessionPayload extends AccountState {
  token: string;
}

export interface SignedIn extends SessionPayload {
  requiresMfa: false;
  message: string;
  tokenType: 'Bearer';
}

export interface PinChallenge {
  requiresMfa: true;
  message: string;
  challengeToken: string;
  channel: Exclude<MfaChannel, 'off'>;
  /** Masked: "082•••0101" or "n•••@example.co.za". */
  destination: string;
  expiresAt: string;
  resendAvailableIn: number;
}

export type LoginResult = SignedIn | PinChallenge;

export interface PinResent {
  message: string;
  destination: string;
  expiresAt: string;
  resendAvailableIn: number;
}

export interface AccountResponse extends AccountState {
  /** false when AUTH_PIN_ENABLED is off on the API: sign-in is password only. */
  pinEnabled?: boolean;
}

export interface MessageResponse {
  message: string;
}

/**
 * `error_type` values from App\Exceptions\AuthFlowException. Error bodies are
 * NOT case-transformed by the axios client, so these stay snake_case.
 */
export type AuthErrorType =
  | 'invalid_credentials'
  | 'account_locked'
  | 'account_disabled'
  | 'no_workspace'
  | 'invalid_pin'
  | 'pin_expired'
  | 'challenge_closed'
  | 'resend_too_soon'
  | 'invalid_reset_token'
  | 'password_reused';
