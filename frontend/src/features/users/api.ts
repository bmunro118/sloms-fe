import { apiRequest } from '@utils/api';
import { ENDPOINTS } from '@utils/config';

// ── Types ──────────────────────────────────────────────────────────────────────

export type UserRole = 'Admin' | 'Manager' | 'Operative' | 'ReadOnly' | 'Customer';

export type UserRecord = {
  userId: number;
  username: string;
  email?: string;
  fullName?: string;
  role?: UserRole;
  isActive?: boolean;
  isLockedOut?: boolean;
  mustChangePassword?: boolean;
  linkedCustomerId?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

export type UsersListResponse = {
  data: UserRecord[];
  total?: number;
  page?: number;
  limit?: number;
};

export type UsersListQuery = {
  includeInactive?: boolean;
  page?: number;
  limit?: number;
};

export type CreateUserPayload = {
  username: string;
  password: string;
  fullName: string;
  email: string;
  role: UserRole;
  linkedCustomerId?: number | null;
};

export type UpdateUserPayload = {
  email?: string;
  fullName?: string;
  role?: UserRole;
  isActive?: boolean;
  linkedCustomerId?: number | null;
};

export type ResetPasswordPayload = {
  newPassword: string;
};

export type AuditLogEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'LOGIN_LOCKED'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_UNLOCKED';

export type AuditLogEntry = {
  id: number;
  userId?: number;
  username?: string;
  event: AuditLogEventType;
  createdAt?: string;
  ipAddress?: string;
  [key: string]: unknown;
};

export type AuditLogResponse = {
  data: AuditLogEntry[];
  total?: number;
  page?: number;
  limit?: number;
};

export type AuditLogQuery = {
  userId?: number;
  event?: AuditLogEventType;
  page?: number;
  limit?: number;
};

type RequestConfig = {
  signal?: AbortSignal;
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function buildUrlWithQuery(baseUrl: string, query?: Record<string, unknown>): string {
  if (!query) {
    return baseUrl;
  }

  const url = new URL(baseUrl);

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    url.searchParams.set(key, String(value));
  });

  return url.toString();
}

// ── API functions ──────────────────────────────────────────────────────────────

export function listUsers(
  query?: UsersListQuery,
  requestConfig?: RequestConfig
): Promise<UsersListResponse> {
  return apiRequest<UsersListResponse>(
    buildUrlWithQuery(ENDPOINTS.users.list, query as Record<string, unknown>),
    { method: 'GET', requireAuth: true, signal: requestConfig?.signal }
  );
}

export function getUser(id: number, requestConfig?: RequestConfig): Promise<UserRecord> {
  return apiRequest<UserRecord>(ENDPOINTS.users.byId(id), {
    method: 'GET',
    requireAuth: true,
    signal: requestConfig?.signal,
  });
}

export function createUser(payload: CreateUserPayload): Promise<UserRecord> {
  return apiRequest<UserRecord>(ENDPOINTS.users.list, {
    method: 'POST',
    requireAuth: true,
    body: payload,
  });
}

export function updateUser(id: number, payload: UpdateUserPayload): Promise<UserRecord> {
  return apiRequest<UserRecord>(ENDPOINTS.users.byId(id), {
    method: 'PUT',
    requireAuth: true,
    body: payload,
  });
}

export function deleteUser(id: number): Promise<void> {
  return apiRequest<void>(ENDPOINTS.users.byId(id), {
    method: 'DELETE',
    requireAuth: true,
  });
}

export function deactivateUser(id: number): Promise<UserRecord> {
  return apiRequest<UserRecord>(ENDPOINTS.users.deactivate(id), {
    method: 'PATCH',
    requireAuth: true,
  });
}

export function reactivateUser(id: number): Promise<UserRecord> {
  return apiRequest<UserRecord>(ENDPOINTS.users.reactivate(id), {
    method: 'PATCH',
    requireAuth: true,
  });
}

export function unlockUser(id: number): Promise<UserRecord> {
  return apiRequest<UserRecord>(ENDPOINTS.users.unlock(id), {
    method: 'PATCH',
    requireAuth: true,
  });
}

export function resetUserPassword(id: number, newPassword: string): Promise<void> {
  return apiRequest<void>(ENDPOINTS.users.resetPassword(id), {
    method: 'PATCH',
    requireAuth: true,
    body: { newPassword } satisfies ResetPasswordPayload,
  });
}

export function getAuditLog(
  query?: AuditLogQuery,
  requestConfig?: RequestConfig
): Promise<AuditLogResponse> {
  return apiRequest<AuditLogResponse>(
    buildUrlWithQuery(ENDPOINTS.users.auditLog, query as Record<string, unknown>),
    { method: 'GET', requireAuth: true, signal: requestConfig?.signal }
  );
}

export function getMe(requestConfig?: RequestConfig): Promise<UserRecord> {
  return apiRequest<UserRecord>(ENDPOINTS.users.me, {
    method: 'GET',
    requireAuth: true,
    signal: requestConfig?.signal,
  });
}
