import { getStoredAccessToken, usesCookieAuth } from '@utils/auth';

// ---------------------------------------------------------------------------
// Global unauthorized handler — registered by AuthContext on mount.
// Invoked when an authenticated request receives a 401, so the app can
// aggressively clear session state and return the user to the login screen.
// ---------------------------------------------------------------------------

let _unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void): void {
  _unauthorizedHandler = handler;
}

export function clearUnauthorizedHandler(): void {
  _unauthorizedHandler = null;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

type ErrorPayload = {
  message?: unknown;
  error?: unknown;
  code?: unknown;
};

function extractErrorPayload(contentType: string, responseText: string): ErrorPayload {
  if (!responseText || !contentType.toLowerCase().includes('application/json')) {
    return {};
  }

  try {
    return JSON.parse(responseText) as ErrorPayload;
  } catch {
    return {};
  }
}

function getStatusMessage(status: number): string {
  if (status === 400 || status === 422) {
    return 'Please check your input and try again.';
  }
  if (status === 401) {
    return 'Authentication failed. Please sign in again.';
  }
  if (status === 403) {
    return 'You do not have permission to perform this action.';
  }
  if (status === 404) {
    return 'The requested resource was not found.';
  }
  if (status === 409) {
    return 'The request conflicted with current data. Refresh and try again.';
  }
  if (status >= 500) {
    return 'A server error occurred. Please try again later.';
  }

  return 'Request failed. Please try again.';
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  requireAuth?: boolean;
  token?: string; // explicit token; if omitted and requireAuth=true, reads from storage
  // When true, a 401 will NOT invoke the global unauthorized handler (which
  // clears the session). Use for endpoints where a 401 means "wrong code"
  // rather than "expired session" — e.g. the 2FA verify/enable/disable flows.
  suppressUnauthorizedHandler?: boolean;
  signal?: AbortSignal;
  responseType?: 'auto' | 'json' | 'text' | 'blob';
};

export async function apiRequest<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = 'GET',
    body,
    headers = {},
    requireAuth = true,
    token: explicitToken,
    suppressUnauthorizedHandler = false,
    signal,
    responseType = 'auto',
  } = options;

  let authToken: string | null = explicitToken ?? null;
  if (requireAuth && !authToken && !usesCookieAuth()) {
    authToken = await getStoredAccessToken();
  }

  const requestHeaders: Record<string, string> = {
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...headers,
  };

  const hasBody = body !== undefined && body !== null;
  
  // Handle FormData specially - don't set Content-Type header or stringify
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  
  if (hasBody && !isFormData && !('Content-Type' in requestHeaders)) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    method,
    signal,
    credentials: usesCookieAuth() ? 'include' : 'omit',
    headers: requestHeaders,
    body: hasBody && isFormData ? body : (hasBody ? JSON.stringify(body) : undefined),
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type') ?? '';
    const responseText = await response.text();
    console.error(`[apiRequest] ${method} ${url} → ${response.status}:`, responseText);
    const payload = extractErrorPayload(contentType, responseText);
    const code = typeof payload.code === 'string'
      ? payload.code
      : typeof payload.message === 'string'
        ? payload.message
        : Array.isArray(payload.message) && payload.message.length > 0
          ? String(payload.message[0])
          : typeof payload.error === 'string'
            ? payload.error
            : undefined;

    // When an authenticated request is rejected with 401, the session token
    // is no longer valid. Notify the auth layer so it can clear state and
    // redirect the user to login — do this before throwing so the screen's
    // catch block sees a normal ApiError rather than a stale-state race.
    if (response.status === 401 && requireAuth && !suppressUnauthorizedHandler) {
      _unauthorizedHandler?.();
    }

    // Keep backend details out of user-facing errors.
    throw new ApiError(getStatusMessage(response.status), response.status, code);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (responseType === 'blob') {
    return (await response.blob()) as T;
  }

  if (responseType === 'text') {
    return (await response.text()) as T;
  }

  if (responseType === 'json') {
    return response.json() as Promise<T>;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.toLowerCase().includes('application/json')) {
    return response.json() as Promise<T>;
  }

  return (await response.text()) as T;
}
