// Shared backend-provisioning helpers for the e2e suite.
//
// Tests drive the real UI, but their preconditions (users, etc.) are set up
// through the backend API — faster and more reliable than clicking through admin
// screens. Reuse `provisionUser()` from any spec (or from global-setup) to mint a
// fresh, ready-to-log-in user.

const API_BASE = process.env.E2E_API_URL ?? 'http://localhost:3000';
const ADMIN = { username: 'admin', password: 'admin123' };
// The seed pre-trusts this device for admin, so admin's own mandatory-2FA
// challenge is skipped and login yields a full token (see prisma/seed.sql).
const ADMIN_DEVICE_TOKEN = 'e2e-trust-admin';

export type Role = 'Admin' | 'Manager' | 'Operative' | 'ReadOnly';

export interface ProvisionedUser {
  username: string;
  password: string;
  role: Role;
}

interface JsonResponse {
  status?: string;
  accessToken?: string;
  [key: string]: unknown;
}

export async function apiPost(
  endpoint: string,
  body: Record<string, unknown>,
  headers: Record<string, string> = {},
): Promise<JsonResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new Error(
      `Cannot reach the backend at ${API_BASE}${endpoint}. Start the API with ` +
        `TWOFA_ENFORCE=true and the seed applied (see e2e/README.md). Cause: ${String(err)}`,
    );
  }
  const text = await res.text();
  const json = text ? (JSON.parse(text) as JsonResponse) : {};
  if (!res.ok) {
    throw new Error(`POST ${endpoint} → ${res.status}: ${text}`);
  }
  return json;
}

/** Logs in as the seeded admin (trusted device) and returns a full-access token. */
export async function adminToken(): Promise<string> {
  const login = await apiPost(
    '/api/auth/login',
    { username: ADMIN.username, password: ADMIN.password, clientType: 'mobile' },
    { 'x-device-token': ADMIN_DEVICE_TOKEN },
  );
  if (!login.accessToken) {
    throw new Error(
      `Admin login did not return a full-access token (status=${login.status}). ` +
        'Is the seed applied and the trusted-device token present?',
    );
  }
  return login.accessToken;
}

/**
 * Creates a fresh, uniquely-named user and returns its credentials, ready to log
 * in: the forced first-login password change is already cleared. The user is NOT
 * 2FA-enrolled (staff default method is TOTP), so the first UI login lands on the
 * mandatory-enrollment step when the backend has TWOFA_ENFORCE=true.
 */
export async function provisionUser(role: Role = 'Operative'): Promise<ProvisionedUser> {
  const token = await adminToken();

  const stamp = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const username = `e2e-${stamp}`;
  const initialPassword = 'Initial@1234';
  const password = 'NewPass@1234';

  await apiPost(
    '/api/users',
    {
      username,
      password: initialPassword,
      fullName: 'E2E User',
      email: `${username}@example.com`,
      role,
    },
    { Authorization: `Bearer ${token}` },
  );

  // Clear the forced password change (login → password_change scoped token →
  // change-password) so callers can log straight in.
  const pcLogin = await apiPost('/api/auth/login', {
    username,
    password: initialPassword,
    clientType: 'mobile',
  });
  if (pcLogin.status !== 'password_change' || !pcLogin.accessToken) {
    throw new Error(
      `Expected a password_change challenge for the new user but got status=${pcLogin.status}.`,
    );
  }
  await apiPost(
    '/api/auth/change-password',
    { newPassword: password, clientType: 'mobile' },
    { Authorization: `Bearer ${pcLogin.accessToken}` },
  );

  return { username, password, role };
}
