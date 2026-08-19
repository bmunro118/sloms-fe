import Constants from 'expo-constants';
import { Platform } from 'react-native';

// ── API mode ──────────────────────────────────────────────────────────────────
// Set EXPO_PUBLIC_API_MODE in frontend/.env to switch environments.
// Default (no .env) = 'web' → hosted Azure SLOMS API.
// 'local' → local SLOMS backend on http://localhost:3000.

export type ApiMode = 'local' | 'web';

const LOCAL_API_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
const WEB_API_URL = 'https://slomsapi-stage.jollydune-b8782950.uksouth.azurecontainerapps.io';

export const API_MODE: ApiMode = (() => {
  const mode = (process.env.EXPO_PUBLIC_API_MODE ?? '').trim().toLowerCase();
  return mode === 'local' ? 'local' : 'web';
})();

// ── API base URL ──────────────────────────────────────────────────────────────

// Runtime override (web only). The container serves /runtime-config.js (generated
// from the API_BASE_URL env var at startup — see frontend/docker-entrypoint.d),
// which sets this global before the app bundle evaluates. This lets ONE built
// image target different backends per environment (dev vs prod) without rebaking,
// preserving the build-once / promote model. Native builds never set it.
function readRuntimeApiBaseUrl(): string | undefined {
  const runtime = (globalThis as { __SLOMS_RUNTIME_CONFIG__?: { apiBaseUrl?: string } })
    .__SLOMS_RUNTIME_CONFIG__;
  const url = runtime?.apiBaseUrl?.trim();
  return url ? url : undefined;
}

const RAW_API_BASE_URL: string =
  readRuntimeApiBaseUrl() ??
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
  (API_MODE === 'local' ? LOCAL_API_URL : WEB_API_URL);

function assertValidApiBaseUrl(url: string): string {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error(
      'API base URL is invalid or missing. Set EXPO_PUBLIC_API_MODE to "web" or "local", or set EXPO_PUBLIC_API_URL to a full URL including protocol.'
    );
  }

  const protocol = parsedUrl.protocol.toLowerCase();
  const host = parsedUrl.hostname.toLowerCase();
  const isLocalOrPrivateIp =
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '10.0.2.2' ||
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(host) ||
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host);

  if (protocol === 'https:') {
    return parsedUrl.origin;
  }

  if (__DEV__ && protocol === 'http:' && isLocalOrPrivateIp) {
    return parsedUrl.origin;
  }

  throw new Error('Insecure API base URL blocked. Use HTTPS in production.');
}

export const API_BASE_URL: string = assertValidApiBaseUrl(RAW_API_BASE_URL);

// ── Auth transport ────────────────────────────────────────────────────────────
// Production web: cookie auth (HttpOnly cookies managed by SLOMS).
// Native mobile: bearer token auth.
// Local dev web: token auth (avoids credentialed cross-origin CORS issues).
//
// Rules (in priority order):
//  1. Native (non-web) → always token
//  2. Production build (not __DEV__) → always cookie
//  3. Non-localhost browser → cookie
//  4. local mode → token
//  5. Cross-origin API → token
//  6. Same-origin API → cookie

function resolveUsesCookieAuth(): boolean {
  if (Platform.OS !== 'web') return false;
  if (!__DEV__) return true;

  if (typeof window === 'undefined') return true;

  const host = window.location.hostname.trim().toLowerCase();
  const isLocalHost = host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
  if (!isLocalHost) return true;

  if (API_MODE === 'local') return false;

  try {
    return new URL(API_BASE_URL).origin === window.location.origin;
  } catch {
    return false;
  }
}

export const USES_COOKIE_AUTH: boolean = resolveUsesCookieAuth();

export function usesCookieAuth(): boolean {
  return USES_COOKIE_AUTH;
}

// ── Endpoints ─────────────────────────────────────────────────────────────────

const e = (path: string) => `${API_BASE_URL}${path}`;

export const ENDPOINTS = {
  // ── Auth ───────────────────────────────────────────────────────────────────
  auth: {
    login: e('/api/auth/login'),
    logout: e('/api/auth/logout'),
    changePassword: e('/api/auth/change-password'),
    me: e('/api/auth/me'),
    twoFactor: {
      setup: e('/api/auth/2fa/setup'),
      enable: e('/api/auth/2fa/enable'),
      verify: e('/api/auth/verify-2fa'),
      resend: e('/api/auth/2fa/resend'),
      disable: e('/api/auth/2fa/disable'),
    },
    devices: {
      list: e('/api/auth/devices'),
      all: e('/api/auth/devices'),
      byId: (id: number) => e(`/api/auth/devices/${id}`),
    },
  },

  // ── Users ──────────────────────────────────────────────────────────────────
  users: {
    me: e('/api/users/me'),
    mePassword: e('/api/users/me/password'),
    auditLog: e('/api/users/audit-log'),
    list: e('/api/users'),
    byId: (id: number) => e(`/api/users/${id}`),
    deactivate: (id: number) => e(`/api/users/${id}/deactivate`),
    reactivate: (id: number) => e(`/api/users/${id}/reactivate`),
    unlock: (id: number) => e(`/api/users/${id}/unlock`),
    resetPassword: (id: number) => e(`/api/users/${id}/reset-password`),
  },

  // ── Customers ──────────────────────────────────────────────────────────────
  customers: {
    list: e('/api/customers'),
    byId: (id: number) => e(`/api/customers/${id}`),
    suspend: (id: number) => e(`/api/customers/${id}/suspend`),
    reinstate: (id: number) => e(`/api/customers/${id}/reinstate`),
    onboard: (id: number) => e(`/api/customers/${id}/onboard`),
    addresses: (customerId: number) => e(`/api/customers/${customerId}/addresses`),
    addressById: (customerId: number, addressId: number) =>
      e(`/api/customers/${customerId}/addresses/${addressId}`),
    setDefaultAddress: (customerId: number, addressId: number) =>
      e(`/api/customers/${customerId}/addresses/${addressId}/set-default`),
  },

  // ── Orders ─────────────────────────────────────────────────────────────────
  orders: {
    list: e('/api/orders'),
    byId: (orderNumber: number, orderBatch: number) =>
      e(`/api/orders/${orderNumber}/${orderBatch}`),
    tracking: (orderNumber: number, orderBatch: number) =>
      e(`/api/orders/${orderNumber}/${orderBatch}/tracking`),
    dispatch: (orderNumber: number, orderBatch: number) =>
      e(`/api/orders/${orderNumber}/${orderBatch}/dispatch`),
    breakdown: (orderNumber: number, orderBatch: number) =>
      e(`/api/orders/${orderNumber}/${orderBatch}/breakdown`),
    items: (orderNumber: number, orderBatch: number) =>
      e(`/api/orders/${orderNumber}/${orderBatch}/items`),
    itemById: (orderNumber: number, orderBatch: number, serialNumber: string) =>
      e(`/api/orders/${orderNumber}/${orderBatch}/items/${serialNumber}`),
    itemBySerial: (serialNumber: string) => e(`/api/orders/items/${serialNumber}`),
    checkoutItem: (orderNumber: number, orderBatch: number, serialNumber: string) =>
      e(`/api/orders/${orderNumber}/${orderBatch}/items/${serialNumber}/checkout`),
    uncheckedOutItem: (orderNumber: number, orderBatch: number, serialNumber: string) =>
      e(`/api/orders/${orderNumber}/${orderBatch}/items/${serialNumber}/unchecked-out`),
    fromLabel: (orderNumber: number, orderBatch: number) =>
      e(`/api/orders/${orderNumber}/${orderBatch}/items/from-label`),
  },

  // ── Price List ─────────────────────────────────────────────────────────────
  priceList: {
    list: e('/api/price-list'),
    byId: (itemId: string) => e(`/api/price-list/${itemId}`),
    allListsForItem: (itemId: string) => e(`/api/price-list/${itemId}/lists`),
    priceForList: (itemId: string, listName: string) =>
      e(`/api/price-list/${itemId}/lists/${listName}`),
    lists: e('/api/price-list/lists'),
    revisions: e('/api/price-list/revisions'),
    revisionById: (id: number) => e(`/api/price-list/revisions/${id}`),
    activateRevision: (id: number) => e(`/api/price-list/revisions/${id}/activate`),
    exportCsv: e('/api/price-list/export'),
    importCsv: e('/api/price-list/import'),
    voidItem: (itemId: string) => e(`/api/price-list/items/${itemId}`),
    voidListType: (id: number) => e(`/api/price-list/lists/${id}`),
  },

  // ── Settings ───────────────────────────────────────────────────────────────
  settings: {
    list: e('/api/settings'),
    byKey: (key: string) => e(`/api/settings/${key}`),
    value: (key: string) => e(`/api/settings/${key}/value`),
    userSettings: e('/api/settings/user'),
    userSetting: (key: string) => e(`/api/settings/user/${key}`),
  },

  // ── Stats ──────────────────────────────────────────────────────────────────
  stats: {
    timeseries: e('/api/stats/timeseries'),
    builder: e('/api/stats/builder'),
  },

  // ── VAT Rates ──────────────────────────────────────────────────────────────
  vatRates: {
    list: e('/api/vat-rates'),
    current: e('/api/vat-rates/current'),
    close: (id: number) => e(`/api/vat-rates/${id}/close`),
  },

  // ── Documents ──────────────────────────────────────────────────────────────
  documents: {
    list: e('/api/documents'),
  },
};


