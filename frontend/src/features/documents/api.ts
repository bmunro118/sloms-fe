import { apiRequest } from '@utils/api';
import { ENDPOINTS } from '@utils/config';

// ── Types ──────────────────────────────────────────────────────────────────────

export type DocumentRow = {
  id: number;
  type?: string;
  generatedDate?: string;
  orderReference?: string;
};

export type DocumentsListResponse = {
  data?: DocumentRow[];
};

type RequestConfig = {
  signal?: AbortSignal;
};

// ── API functions ──────────────────────────────────────────────────────────────

export function listDocuments(
  query?: { search?: string },
  requestConfig?: RequestConfig
): Promise<DocumentsListResponse> {
  let url = ENDPOINTS.documents.list;
  if (query?.search?.trim()) {
    const u = new URL(url);
    u.searchParams.set('search', query.search.trim());
    url = u.toString();
  }
  return apiRequest<DocumentsListResponse>(url, {
    method: 'GET',
    requireAuth: true,
    signal: requestConfig?.signal,
  });
}
