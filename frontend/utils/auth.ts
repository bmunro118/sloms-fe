import { Platform } from 'react-native';
import { usesCookieAuth } from '@utils/config';

const ACCESS_TOKEN_KEY = 'sloms.access-token';
let secureStoreModulePromise: Promise<typeof import('expo-secure-store')> | null = null;
let inMemoryAccessToken: string | null | undefined;

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

async function getSecureStoreModule(): Promise<typeof import('expo-secure-store')> {
  if (!secureStoreModulePromise) {
    secureStoreModulePromise = import('expo-secure-store');
  }
  return secureStoreModulePromise;
}

export { usesCookieAuth };

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
  sub: number;
  username: string;
  role: string;
  fullName?: string;
  linkedCustomerId?: number | null;
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
