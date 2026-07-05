import { apiRequest } from '@utils/api';
import { getStoredAccessToken, usesCookieAuth } from '@utils/auth';
import { ENDPOINTS } from '@utils/config';

// ── Types ──────────────────────────────────────────────────────────────────────

export type PriceListItem = {
  itemId: string;
  description?: string;
  category?: string;
  price?: number;
  revisionId?: number;
};

export type PriceListItemsResponse = {
  data?: PriceListItem[];
};

export type ItemListPrice = {
  listName: string;
  price?: number;
  unitPrice?: number;
};

export type ItemListPricesResponse = {
  data?: ItemListPrice[];
};

export type PriceListType = {
  id: number;
  name: string;
  displayName: string | null;
  sortOrder: number;
  isActive: boolean;
  void: boolean;
  voidDateStamp: Date | null;
  voidedBy: string | null;
  createdAt: Date;
  createdBy: string | null;
};

export type PriceListTypesResponse = {
  data?: PriceListType[];
};

export type PriceListRevision = {
  id: number;
  name?: string;
  notes?: string;
  status: 'active' | 'draft' | 'archived' | 'superseded';
  createdAt?: string;
  activatedAt?: string;
  itemCount?: number;
};

export type PriceListRevisionsResponse = {
  data?: PriceListRevision[];
};

export type PriceListRevisionDetail = PriceListRevision & {
  items?: PriceListItem[];
};

export type ImportSummary = {
  imported?: number;
  skipped?: number;
  errors?: string[];
  revision?: PriceListRevision | null;
};

type RequestConfig = {
  signal?: AbortSignal;
};

// ── Items ──────────────────────────────────────────────────────────────────────

export function listPriceListItems(
  query?: { category?: string; revisionId?: number },
  requestConfig?: RequestConfig
): Promise<PriceListItemsResponse | PriceListItem[]> {
  const url = new URL(ENDPOINTS.priceList.list);
  if (query?.category) url.searchParams.set('category', query.category);
  if (query?.revisionId != null) url.searchParams.set('revisionId', String(query.revisionId));
  return apiRequest<PriceListItemsResponse | PriceListItem[]>(url.toString(), {
    method: 'GET',
    requireAuth: true,
    signal: requestConfig?.signal,
  });
}

export function getPriceListItem(
  itemId: string,
  query?: { revisionId?: number }
): Promise<PriceListItem> {
  const url = new URL(ENDPOINTS.priceList.byId(itemId));
  if (query?.revisionId != null) url.searchParams.set('revisionId', String(query.revisionId));
  return apiRequest<PriceListItem>(url.toString(), {
    method: 'GET',
    requireAuth: true,
  });
}

export function getItemLists(itemId: string): Promise<ItemListPricesResponse | ItemListPrice[]> {
  return apiRequest<ItemListPricesResponse | ItemListPrice[]>(
    ENDPOINTS.priceList.allListsForItem(itemId),
    { method: 'GET', requireAuth: true }
  );
}

export function getItemListByName(itemId: string, listName: string): Promise<ItemListPrice> {
  return apiRequest<ItemListPrice>(ENDPOINTS.priceList.priceForList(itemId, listName), {
    method: 'GET',
    requireAuth: true,
  });
}

export function voidPriceListItem(itemId: string): Promise<void> {
  return apiRequest<void>(ENDPOINTS.priceList.voidItem(itemId), {
    method: 'DELETE',
    requireAuth: true,
  });
}

// ── List Types ─────────────────────────────────────────────────────────────────

export function listPriceListTypes(opts?: { signal?: AbortSignal }): Promise<PriceListTypesResponse | PriceListType[]> {
  return apiRequest<PriceListTypesResponse | PriceListType[]>(ENDPOINTS.priceList.lists, {
    method: 'GET',
    requireAuth: true,
    signal: opts?.signal,
  });
}

export function deletePriceListType(id: number): Promise<void> {
  return apiRequest<void>(ENDPOINTS.priceList.voidListType(id), {
    method: 'DELETE',
    requireAuth: true,
  });
}

// ── Revisions ─────────────────────────────────────────────────────────────────

export function listRevisions(
  requestConfig?: RequestConfig
): Promise<PriceListRevisionsResponse | PriceListRevision[]> {
  return apiRequest<PriceListRevisionsResponse | PriceListRevision[]>(
    ENDPOINTS.priceList.revisions,
    { method: 'GET', requireAuth: true, signal: requestConfig?.signal }
  );
}

export function getRevision(id: number): Promise<PriceListRevisionDetail> {
  return apiRequest<PriceListRevisionDetail>(ENDPOINTS.priceList.revisionById(id), {
    method: 'GET',
    requireAuth: true,
  });
}

export function activateRevision(id: number): Promise<PriceListRevision> {
  return apiRequest<PriceListRevision>(ENDPOINTS.priceList.activateRevision(id), {
    method: 'POST',
    requireAuth: true,
  });
}

// ── Export / Import ───────────────────────────────────────────────────────────

export function getExportCsvUrl(revisionId?: number): string {
  const url = new URL(ENDPOINTS.priceList.exportCsv);
  if (revisionId != null) url.searchParams.set('revisionId', String(revisionId));
  return url.toString();
}

export async function importPriceListCsv(
  fileUri: string,
  fileName: string,
  options?: { name?: string; notes?: string; dryRun?: boolean; merge?: boolean }
): Promise<ImportSummary> {
  const url = new URL(ENDPOINTS.priceList.importCsv);
  if (options?.name) url.searchParams.set('name', options.name);
  if (options?.notes) url.searchParams.set('notes', options.notes);
  if (options?.dryRun) url.searchParams.set('dryRun', 'true');
  if (options?.merge) url.searchParams.set('merge', 'true');

  const formData = new FormData();
  formData.append('file', { uri: fileUri, name: fileName, type: 'text/csv' } as unknown as Blob);

  const requestHeaders: Record<string, string> = {};
  if (!usesCookieAuth()) {
    const token = await getStoredAccessToken();
    if (token) requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: requestHeaders,
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `Import failed (${response.status})`);
  }

  return response.json() as Promise<ImportSummary>;
}
