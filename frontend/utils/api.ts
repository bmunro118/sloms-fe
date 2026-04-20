import { getStoredAccessToken } from '@utils/auth';

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
  signal?: AbortSignal;
};

export async function apiRequest<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = 'GET',
    body,
    headers = {},
    requireAuth = true,
    token: explicitToken,
    signal,
  } = options;

  let authToken: string | null = explicitToken ?? null;
  if (requireAuth && !authToken) {
    authToken = await getStoredAccessToken();
  }

  const requestHeaders: Record<string, string> = {
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...headers,
  };

  const hasBody = body !== undefined && body !== null;
  if (hasBody && !('Content-Type' in requestHeaders)) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    method,
    signal,
    headers: requestHeaders,
    body: hasBody ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type') ?? '';
    const responseText = await response.text();
    const payload = extractErrorPayload(contentType, responseText);
    const code = typeof payload.code === 'string' ? payload.code : undefined;

    // Keep backend details out of user-facing errors.
    throw new ApiError(getStatusMessage(response.status), response.status, code);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.toLowerCase().includes('application/json')) {
    return response.json() as Promise<T>;
  }

  return (await response.text()) as T;
}
