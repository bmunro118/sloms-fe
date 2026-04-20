import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'sloms.access-token';

// ---------------------------------------------------------------------------
// Storage — localStorage on web, expo-secure-store on mobile
// ---------------------------------------------------------------------------

export async function persistAccessToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    }
    return;
  }
  const SecureStore = await import('expo-secure-store');
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
}

export async function getStoredAccessToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    }
    return null;
  }
  const SecureStore = await import('expo-secure-store');
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

// Sync token snapshot is available on web only and lets bootstrap avoid a loading flicker.
export function getStoredAccessTokenSnapshot(): string | null {
  if (Platform.OS !== 'web') {
    return null;
  }

  if (typeof localStorage === 'undefined') {
    return null;
  }

  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function clearAccessToken(): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    }
    return;
  }
  const SecureStore = await import('expo-secure-store');
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
