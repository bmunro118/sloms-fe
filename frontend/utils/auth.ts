import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'sloms.access-token';
let secureStoreModulePromise: Promise<typeof import('expo-secure-store')> | null = null;
let inMemoryAccessToken: string | null | undefined;

async function getSecureStoreModule(): Promise<typeof import('expo-secure-store')> {
  if (!secureStoreModulePromise) {
    secureStoreModulePromise = import('expo-secure-store');
  }
  return secureStoreModulePromise;
}

// ---------------------------------------------------------------------------
// Storage — localStorage on web, expo-secure-store on mobile
// ---------------------------------------------------------------------------

export async function persistAccessToken(token: string): Promise<void> {
  inMemoryAccessToken = token;

  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    }
    return;
  }
  const SecureStore = await getSecureStoreModule();
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
}

export async function getStoredAccessToken(): Promise<string | null> {
  if (inMemoryAccessToken !== undefined) {
    return inMemoryAccessToken;
  }

  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      inMemoryAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      return inMemoryAccessToken;
    }
    inMemoryAccessToken = null;
    return null;
  }

  const SecureStore = await getSecureStoreModule();
  inMemoryAccessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  return inMemoryAccessToken;
}

// Sync token snapshot is available on web only and lets bootstrap avoid a loading flicker.
export function getStoredAccessTokenSnapshot(): string | null {
  if (Platform.OS !== 'web') {
    return null;
  }

  if (typeof localStorage === 'undefined') {
    return null;
  }

  inMemoryAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  return inMemoryAccessToken;
}

export async function clearAccessToken(): Promise<void> {
  inMemoryAccessToken = null;

  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    }
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
