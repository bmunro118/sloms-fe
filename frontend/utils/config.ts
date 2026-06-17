import Constants from 'expo-constants';
import { Platform } from 'react-native';

// ── API mode ──────────────────────────────────────────────────────────────────
// Set EXPO_PUBLIC_API_MODE in frontend/.env to switch environments.
// Default (no .env) = 'web' → hosted Azure SLOMS API.
// 'local' → local SLOMS backend on http://localhost:3000.

export type ApiMode = 'local' | 'web';

const LOCAL_API_URL = 'http://localhost:3000';
const WEB_API_URL = 'https://slomsapi.wonderfulsky-1907992c.uksouth.azurecontainerapps.io';

export const API_MODE: ApiMode = (() => {
  const mode = (process.env.EXPO_PUBLIC_API_MODE ?? '').trim().toLowerCase();
  return mode === 'local' ? 'local' : 'web';
})();

// ── API base URL ──────────────────────────────────────────────────────────────

const RAW_API_BASE_URL: string =
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
  const isLocalHost = host === 'localhost' || host === '127.0.0.1';

  if (protocol === 'https:') {
    return parsedUrl.origin;
  }

  if (__DEV__ && protocol === 'http:' && isLocalHost) {
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
    changePassword: e('/api/auth/change-password'),
    me: e('/api/auth/me'),
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

// ── Feature Flags ───────────────────────────────────────────────────────────
// Hardcoded switches for features that are:
// - Built but depend on backend endpoints not yet implemented, OR
// - In active development and not ready for production.
//
// Set a flag to `true` to enable the feature, `false` to hide it.
//
// In `__DEV__` mode, ALL flags are implicitly `true` so developers
// always see in-progress features without modifying flags.

export const FEATURE_FLAGS = {
  // ── Backend-dependent gates ────────────────────────────────────────────────

  /**
   * Price List — Revisions tab
   * Requires: GET /api/price-list/revisions, GET /api/price-list/revisions/{id},
   *           POST /api/price-list/revisions/{id}/activate
   * Backend status: NOT IMPLEMENTED
   */
  priceListRevisions: false,

  /**
   * Price List — List Types tab
   * Requires: GET /api/price-list/lists, DELETE /api/price-list/lists/{id},
   *           GET /api/price-list/{itemId}/lists, GET /api/price-list/{itemId}/lists/{listName}
   * Backend status: NOT IMPLEMENTED
   */
  priceListTypes: false,

  /**
   * All Customer-role users are treated as read-only.
   * When true, Customer users cannot create, edit, or delete any records — edit
   * controls are hidden and mutating actions are blocked in the UI.
   * When false, Customer users have the same write access as an Operative.
   *
   * This flag is the global default. In future, a per-account setting
   * (customerReadOnly on the account record) will be able to override it,
   * enforcing read-only on a per-customer basis regardless of this flag.
   */
  allCustomersReadOnly: true,

} as const;

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

/**
 * Returns true if a feature flag is enabled.
 * In __DEV__ mode all flags are considered enabled so developers
 * can see and test in-progress features without modifying flags.
 */
export function isFeatureEnabled(flag: FeatureFlagKey): boolean {
  if (__DEV__) return true;
  return FEATURE_FLAGS[flag] === true;
}
