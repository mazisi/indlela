import axiosClient from '@/api/axiosClient';
import type { AccountResponse, AccountState, AuthUser, LoginResult, MessageResponse, MfaChannel, PinResent, SignedIn } from '../types';

// Request bodies are written camelCase; the axios client sends snake_case.

export async function login(body: { email: string; password: string }): Promise<LoginResult> {
  const { data } = await axiosClient.post<LoginResult>('/login', body);
  return data;
}

export async function verifyPin(body: { challengeToken: string; code: string }): Promise<LoginResult> {
  const { data } = await axiosClient.post<LoginResult>('/login/verify-pin', body);
  return data;
}

export async function resendPin(body: { challengeToken: string }): Promise<PinResent> {
  const { data } = await axiosClient.post<PinResent>('/login/resend-pin', body);
  return data;
}

export async function logout(): Promise<MessageResponse> {
  const { data } = await axiosClient.post<MessageResponse>('/logout');
  return data;
}

export async function forgotPassword(body: { email: string }): Promise<MessageResponse> {
  const { data } = await axiosClient.post<MessageResponse>('/forgot-password', body);
  return data;
}

/** Also sets the first password from an invite link (same token flow). */
export async function resetPassword(body: {
  token: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}): Promise<MessageResponse> {
  const { data } = await axiosClient.post<MessageResponse>('/reset-password', body);
  return data;
}

/** Workspace sign-up: creates the account and its workspace and signs in straight away (no approval). */
export async function register(body: {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  workspaceName: string;
}): Promise<SignedIn> {
  const { data } = await axiosClient.post<SignedIn>('/register', body);
  return { ...data, requiresMfa: false };
}

/** The signed-in user, roles and permissions in the current workspace, and the workspaces to switch to. */
export async function getAccount(): Promise<AccountResponse> {
  const { data } = await axiosClient.get<AccountResponse>('/me');
  return data;
}

export async function updateAccount(body: { mobile?: string; mfaChannel?: MfaChannel }): Promise<{ message: string; user: AuthUser }> {
  const { data } = await axiosClient.put<{ message: string; user: AuthUser }>('/account', body);
  return data;
}

export async function changePassword(body: {
  currentPassword: string;
  password: string;
  passwordConfirmation: string;
}): Promise<MessageResponse> {
  const { data } = await axiosClient.put<MessageResponse>('/account/password', body);
  return data;
}

/** Make another of the user's workspaces current. Same body as GET /me; the token stays. */
export async function switchWorkspace(id: number): Promise<AccountState> {
  const { data } = await axiosClient.post<AccountState>(`/workspaces/${id}/switch`);
  return data;
}
