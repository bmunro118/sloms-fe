import { apiRequest } from '@utils/api';
import { usesCookieAuth } from '@utils/auth';
import { ENDPOINTS } from '@utils/config';

// ── Types ────────────────────────────────────────────────────────────────────

export type TwoFactorMethod = 'totp' | 'email';

/** Login outcome from POST /auth/login (and /auth/change-password). */
export type LoginStatus = 'ok' | 'password_change' | 'enroll' | '2fa';

export interface LoginResponse {
  status?: LoginStatus;
  /** Present for bearer (mobile/local-dev) clients; omitted for cookie clients. */
  accessToken?: string;
  token?: string; // legacy alias
  /** Raw trusted-device token (bearer clients only) issued when a device is trusted. */
  deviceToken?: string;
  userId?: number;
  username?: string;
  role?: string;
  fullName?: string | null;
  linkedCustomerId?: number | null;
  /** @deprecated superseded by status === 'password_change' */
  mustChangePassword?: boolean;
  enrollRequired?: boolean;
  twoFactorRequired?: boolean;
  twoFactorMethod?: TwoFactorMethod;
}

export interface SetupResponse {
  method: TwoFactorMethod;
  /** TOTP only. */
  otpauthUrl?: string;
  /** TOTP only — PNG data URL for the enrollment QR code. */
  qrDataUrl?: string;
  /** Email only — masked destination the code was sent to. */
  sentTo?: string;
}

/** Shared shape for the step that completes 2FA and yields a full session. */
export interface CompleteResponse extends LoginResponse {
  /** TOTP enrollment only — one-time recovery codes, shown once. */
  recoveryCodes?: string[];
}

export interface TrustedDevice {
  id: number;
  label: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Resolves the explicit bearer token to attach. Cookie clients never send a
 * token in the header (the scoped/session cookie travels automatically); bearer
 * clients pass the in-memory scoped token for step-up calls.
 */
function bearer(token: string | null | undefined): string | undefined {
  return usesCookieAuth() ? undefined : (token ?? undefined);
}

const clientType = (): 'web' | 'mobile' => (usesCookieAuth() ? 'web' : 'mobile');

// ── Step-up flow (scoped token from login) ─────────────────────────────────────
//
// These run during the login challenge. They authenticate with a scoped token
// (bearer) or scoped cookie (web), so requireAuth is false and the global
// unauthorized handler is suppressed — a 401 here means "wrong/expired code",
// not "session dead".

export function setupTwoFactor(scopedToken: string | null): Promise<SetupResponse> {
  return apiRequest<SetupResponse>(ENDPOINTS.auth.twoFactor.setup, {
    method: 'POST',
    requireAuth: false,
    token: bearer(scopedToken),
    suppressUnauthorizedHandler: true,
  });
}

export function enableTwoFactor(
  scopedToken: string | null,
  code: string,
  rememberDevice: boolean,
): Promise<CompleteResponse> {
  return apiRequest<CompleteResponse>(ENDPOINTS.auth.twoFactor.enable, {
    method: 'POST',
    requireAuth: false,
    token: bearer(scopedToken),
    suppressUnauthorizedHandler: true,
    body: { code: code.trim(), rememberDevice, clientType: clientType() },
  });
}

export function verifyTwoFactor(
  scopedToken: string | null,
  code: string,
  rememberDevice: boolean,
): Promise<CompleteResponse> {
  return apiRequest<CompleteResponse>(ENDPOINTS.auth.twoFactor.verify, {
    method: 'POST',
    requireAuth: false,
    token: bearer(scopedToken),
    suppressUnauthorizedHandler: true,
    body: { code: code.trim(), rememberDevice, clientType: clientType() },
  });
}

export function resendTwoFactorCode(scopedToken: string | null): Promise<{ sentTo: string }> {
  return apiRequest<{ sentTo: string }>(ENDPOINTS.auth.twoFactor.resend, {
    method: 'POST',
    requireAuth: false,
    token: bearer(scopedToken),
    suppressUnauthorizedHandler: true,
  });
}

// ── Authenticated management (full session token) ──────────────────────────────
//
// Voluntary enable/disable and device management for an already-signed-in user.
// requireAuth is true so the session token is attached, but a 401 from the
// code-bearing calls (enable/disable) is suppressed so a wrong code does not
// nuke the session.

export function setupTwoFactorAuthed(): Promise<SetupResponse> {
  return apiRequest<SetupResponse>(ENDPOINTS.auth.twoFactor.setup, {
    method: 'POST',
    requireAuth: true,
    suppressUnauthorizedHandler: true,
  });
}

export function enableTwoFactorAuthed(code: string): Promise<CompleteResponse> {
  return apiRequest<CompleteResponse>(ENDPOINTS.auth.twoFactor.enable, {
    method: 'POST',
    requireAuth: true,
    suppressUnauthorizedHandler: true,
    body: { code: code.trim(), rememberDevice: false, clientType: clientType() },
  });
}

export function disableTwoFactor(code: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(ENDPOINTS.auth.twoFactor.disable, {
    method: 'POST',
    requireAuth: true,
    suppressUnauthorizedHandler: true,
    body: { code: code.trim() },
  });
}

export function listTrustedDevices(signal?: AbortSignal): Promise<TrustedDevice[]> {
  return apiRequest<TrustedDevice[]>(ENDPOINTS.auth.devices.list, {
    method: 'GET',
    requireAuth: true,
    signal,
  });
}

export function revokeTrustedDevice(id: number): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(ENDPOINTS.auth.devices.byId(id), {
    method: 'DELETE',
    requireAuth: true,
  });
}

export function revokeAllTrustedDevices(): Promise<{ revoked: number }> {
  return apiRequest<{ revoked: number }>(ENDPOINTS.auth.devices.all, {
    method: 'DELETE',
    requireAuth: true,
  });
}
