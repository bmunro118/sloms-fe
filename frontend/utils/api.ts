import { getStoredAccessToken } from '@utils/auth';

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
    const responseText = await response.text();
    throw new Error(`Request failed (${response.status}): ${responseText || response.statusText}`);
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
