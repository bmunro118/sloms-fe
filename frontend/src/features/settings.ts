import { apiRequest } from '@utils/api';
import { ENDPOINTS } from '@utils/config';

// ── Types ──────────────────────────────────────────────────────────────────────

export type SettingRecord = {
  key: string;
  val?: string;
  description?: string;
  exposed?: boolean;
  isHidden?: boolean;
};

export type SettingsListResponse = {
  data: SettingRecord[];
  total?: number;
  page?: number;
  limit?: number;
};

export type SettingsListQuery = {
  includeHidden?: boolean;
  page?: number;
  limit?: number;
};

export type UpdateSettingPayload = {
  val?: string;
  description?: string;
  exposed?: boolean;
};

export type PatchSettingValuePayload = {
  val: string;
};

export type UserSettingRecord = {
  key: string;
  val?: string;
};

export type UserSettingsListResponse = {
  data: UserSettingRecord[];
  total?: number;
};

type RequestConfig = {
  signal?: AbortSignal;
};

function buildUrlWithQuery(baseUrl: string, query?: Record<string, unknown>): string {
  if (!query) return baseUrl;
  const url = new URL(baseUrl);
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      url.searchParams.set(k, String(v));
    }
  });
  return url.toString();
}

// ── Global settings ────────────────────────────────────────────────────────────

export function listSettings(
  query?: SettingsListQuery,
  requestConfig?: RequestConfig
): Promise<SettingsListResponse> {
  return apiRequest<SettingsListResponse>(
    buildUrlWithQuery(ENDPOINTS.settings.list, query as Record<string, unknown>),
    { method: 'GET', requireAuth: true, signal: requestConfig?.signal }
  );
}

export function getSetting(
  key: string,
  requestConfig?: RequestConfig
): Promise<SettingRecord> {
  return apiRequest<SettingRecord>(ENDPOINTS.settings.byKey(key), {
    method: 'GET',
    requireAuth: true,
    signal: requestConfig?.signal,
  });
}

export function updateSetting(
  key: string,
  payload: UpdateSettingPayload
): Promise<SettingRecord> {
  return apiRequest<SettingRecord>(ENDPOINTS.settings.byKey(key), {
    method: 'PUT',
    requireAuth: true,
    body: payload,
  });
}

export function patchSettingValue(key: string, val: string): Promise<SettingRecord> {
  return apiRequest<SettingRecord>(ENDPOINTS.settings.value(key), {
    method: 'PATCH',
    requireAuth: true,
    body: { val } satisfies PatchSettingValuePayload,
  });
}

// ── User settings ──────────────────────────────────────────────────────────────

export function listUserSettings(
  requestConfig?: RequestConfig
): Promise<UserSettingsListResponse> {
  return apiRequest<UserSettingsListResponse>(ENDPOINTS.settings.userSettings, {
    method: 'GET',
    requireAuth: true,
    signal: requestConfig?.signal,
  });
}

export function getUserSetting(
  key: string,
  requestConfig?: RequestConfig
): Promise<UserSettingRecord> {
  return apiRequest<UserSettingRecord>(ENDPOINTS.settings.userSetting(key), {
    method: 'GET',
    requireAuth: true,
    signal: requestConfig?.signal,
  });
}

export function upsertUserSetting(key: string, val: string): Promise<UserSettingRecord> {
  return apiRequest<UserSettingRecord>(ENDPOINTS.settings.userSetting(key), {
    method: 'PUT',
    requireAuth: true,
    body: { val },
  });
}

export function deleteUserSetting(key: string): Promise<void> {
  return apiRequest<void>(ENDPOINTS.settings.userSetting(key), {
    method: 'DELETE',
    requireAuth: true,
  });
}
