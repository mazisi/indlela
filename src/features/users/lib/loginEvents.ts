import type { LoginEventType } from '../types';

/** Filter options, in the order a reviewer thinks about them. Labels match the API. */
export const LOGIN_EVENT_OPTIONS: { value: LoginEventType; label: string }[] = [
  { value: 'signed_in', label: 'Signed in' },
  { value: 'signed_out', label: 'Signed out' },
  { value: 'wrong_password', label: 'Wrong password' },
  { value: 'account_locked', label: 'Account locked' },
  { value: 'unlocked', label: 'Unlocked' },
  { value: 'unknown_user', label: 'Unknown user' },
  { value: 'blocked_status', label: 'Sign-in refused' },
  { value: 'pin_sent', label: 'Password correct' },
  { value: 'wrong_pin', label: 'Wrong one-time PIN' },
  { value: 'pin_expired', label: 'One-time PIN expired' },
  { value: 'reset_requested', label: 'Reset requested' },
  { value: 'password_reset', label: 'Password reset' },
  { value: 'password_changed', label: 'Password changed' },
  { value: 'registered', label: 'Signed up' },
  { value: 'created', label: 'Added to a workspace' },
  { value: 'disabled', label: 'Account disabled' },
  { value: 'enabled', label: 'Account enabled' },
  { value: 'switched_workspace', label: 'Switched workspace' },
];

/** Events a reviewer should notice: shown in red. */
const ALERT_EVENTS = new Set<LoginEventType>([
  'wrong_password',
  'account_locked',
  'unknown_user',
  'blocked_status',
  'wrong_pin',
  'pin_expired',
  'disabled',
]);

export const isAlertEvent = (event: LoginEventType) => ALERT_EVENTS.has(event);
