import { getStoredAccessToken } from './auth';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  requireAuth?: boolean;
  token?: string; // explicit token; if omitted and requireAuth=true, reads from storage
};

export async function apiRequest<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = 'GET',
    body,
    headers = {},
    requireAuth = true,
    token: explicitToken,
  } = options;

  let authToken: string | null = explicitToken ?? null;
  if (requireAuth && !authToken) {
    authToken = await getStoredAccessToken();
  }

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Request failed (${response.status}): ${responseText || response.statusText}`);
  }

  return response.json() as Promise<T>;
}
