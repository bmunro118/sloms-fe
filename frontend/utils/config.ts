import Constants from 'expo-constants';

// ── API mode ─────────────────────────────────────────────────────────────────
// Set EXPO_PUBLIC_API_MODE to 'local' or 'web' in frontend/.env to switch
// between the local SQLite backend and the hosted Azure API.
// EXPO_PUBLIC_API_URL overrides the resolved URL entirely when set explicitly.

export type ApiMode = 'local' | 'web';

const LOCAL_API_URL = 'http://localhost:3000';
const WEB_API_URL = 'https://slomsapi.wonderfulsky-1907992c.uksouth.azurecontainerapps.io';

export const API_MODE: ApiMode = (() => {
  const mode = (process.env.EXPO_PUBLIC_API_MODE ?? '').trim().toLowerCase();
  return mode === 'local' ? 'local' : 'web';
})();

// ── API base URL ─────────────────────────────────────────────────────────────

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
