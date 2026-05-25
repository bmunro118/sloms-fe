import { Platform } from 'react-native';
import { API_BASE_URL, API_MODE } from '@utils/config';

const ACCESS_TOKEN_KEY = 'sloms.access-token';
let secureStoreModulePromise: Promise<typeof import('expo-secure-store')> | null = null;
let inMemoryAccessToken: string | null | undefined;
type WebAuthMode = 'cookie' | 'token';

function isLocalWebHost(hostname: string): boolean {
  const normalizedHost = hostname.trim().toLowerCase();
  return (
    normalizedHost === 'localhost' || normalizedHost === '127.0.0.1' || normalizedHost === '[::1]'
  );
}

function getWebStorage(): Storage | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return null;
  }

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function resolveWebAuthMode(): WebAuthMode {
  if (Platform.OS !== 'web') {
    return 'token';
  }

  if (!__DEV__) {
    return 'cookie';
  }

  if (typeof window === 'undefined' || !isLocalWebHost(window.location.hostname)) {
    return 'cookie';
  }

  const configuredMode = (process.env.EXPO_PUBLIC_WEB_AUTH_MODE ?? '').trim().toLowerCase();
  if (configuredMode === 'cookie' || configuredMode === 'token') {
    return configuredMode;
  }

  // Local mode always uses token auth — the local NestJS backend issues JWT bearer tokens.
  if (API_MODE === 'local') {
    return 'token';
  }

  try {
    if (new URL(API_BASE_URL).origin !== window.location.origin) {
      return 'token';
    }
  } catch {
    return 'token';
  }

  return 'cookie';
}

async function getSecureStoreModule(): Promise<typeof import('expo-secure-store')> {
  if (!secureStoreModulePromise) {
    secureStoreModulePromise = import('expo-secure-store');
  }
  return secureStoreModulePromise;
}

export function usesCookieAuth(): boolean {
  return resolveWebAuthMode() === 'cookie';
}

// ---------------------------------------------------------------------------
// Storage — mobile uses expo-secure-store; web relies on HttpOnly cookies
// ---------------------------------------------------------------------------

export async function persistAccessToken(token: string | null | undefined): Promise<void> {
  if (Platform.OS === 'web' && !usesCookieAuth()) {
    inMemoryAccessToken = token ?? null;

    const webStorage = getWebStorage();
    if (!webStorage) {
      return;
    }

    if (!token) {
      webStorage.removeItem(ACCESS_TOKEN_KEY);
      return;
    }

    webStorage.setItem(ACCESS_TOKEN_KEY, token);
    return;
  }

  if (usesCookieAuth()) {
    inMemoryAccessToken = null;
    return;
  }

  if (!token) {
    inMemoryAccessToken = null;
    return;
  }

  inMemoryAccessToken = token;

  const SecureStore = await getSecureStoreModule();
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
}

export async function getStoredAccessToken(): Promise<string | null> {
  if (Platform.OS === 'web' && !usesCookieAuth()) {
    if (inMemoryAccessToken !== undefined) {
      return inMemoryAccessToken;
    }

    const webStorage = getWebStorage();
    inMemoryAccessToken = webStorage?.getItem(ACCESS_TOKEN_KEY) ?? null;
    return inMemoryAccessToken;
  }

  if (usesCookieAuth()) {
    inMemoryAccessToken = null;
    return null;
  }

  if (inMemoryAccessToken !== undefined) {
    return inMemoryAccessToken;
  }

  const SecureStore = await getSecureStoreModule();
  inMemoryAccessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  return inMemoryAccessToken;
}

export function getStoredAccessTokenSnapshot(): string | null {
  if (Platform.OS === 'web' && !usesCookieAuth()) {
    const webStorage = getWebStorage();
    inMemoryAccessToken = webStorage?.getItem(ACCESS_TOKEN_KEY) ?? null;
    return inMemoryAccessToken;
  }

  if (usesCookieAuth()) {
    inMemoryAccessToken = null;
    return null;
  }

  return inMemoryAccessToken ?? null;
}

export async function clearAccessToken(): Promise<void> {
  inMemoryAccessToken = null;

  if (Platform.OS === 'web' && !usesCookieAuth()) {
    const webStorage = getWebStorage();
    webStorage?.removeItem(ACCESS_TOKEN_KEY);
    return;
  }

  if (usesCookieAuth()) {
    return;
  }

  const SecureStore = await getSecureStoreModule();
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
}

// ---------------------------------------------------------------------------
// JWT decode — base64url decode the payload, no signature verification
// ---------------------------------------------------------------------------

export interface JwtPayload {
  userId: number;
  username: string;
  role: string;
  fullName?: string;
  scope?: string; // 'password_change' for forced-change scoped tokens
  iat?: number;
  exp?: number;
}

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    return JSON.parse(atob(padded)) as JwtPayload;
  } catch {
    return null;
  }
}
