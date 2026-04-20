import { API_BASE_URL } from './config';
import { getStoredAccessToken } from './auth';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  requireAuth?: boolean;
};

function buildUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = 'GET',
    body,
    headers = {},
    requireAuth = true,
  } = options;

  const token = requireAuth ? await getStoredAccessToken() : null;

  const response = await fetch(buildUrl(path), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
