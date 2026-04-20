const ACCESS_TOKEN_KEY = 'sloms.access-token';
let inMemoryToken: string | null = null;

type UserRole = 'admin' | 'client';

function hasBrowserStorage() {
  return typeof globalThis !== 'undefined' && typeof globalThis.localStorage !== 'undefined';
}

export async function getStoredAccessToken() {
  if (hasBrowserStorage()) {
    return globalThis.localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  return inMemoryToken;
}

export async function persistAccessToken(token: string) {
  if (hasBrowserStorage()) {
    globalThis.localStorage.setItem(ACCESS_TOKEN_KEY, token);
    return;
  }

  inMemoryToken = token;
}

export async function clearAccessToken() {
  if (hasBrowserStorage()) {
    globalThis.localStorage.removeItem(ACCESS_TOKEN_KEY);
    return;
  }

  inMemoryToken = null;
}

export function decodeRoleFromToken(token: string | null): UserRole | null {
  if (!token) {
    return null;
  }

  if (token.startsWith('mock-admin:')) {
    return 'admin';
  }

  if (token.startsWith('mock-client:')) {
    return 'client';
  }

  return null;
}

export function createMockToken(role: UserRole) {
  return `mock-${role}:${Date.now()}`;
}
