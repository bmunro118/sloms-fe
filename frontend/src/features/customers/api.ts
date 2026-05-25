import { apiRequest } from '@utils/api';
import { ENDPOINTS } from '@utils/config';

// ── Types ──────────────────────────────────────────────────────────────────────

export type CustomerRecord = {
  customerId: number;
  accountNumber?: string;
  centreNumber?: string;
  companyName: string;
  invBuildingName?: string;
  invAddressLn1?: string;
  invAddressLn2?: string;
  invTownOrCity?: string;
  invCounty?: string;
  invPostCode?: string;
  contactName?: string;
  contactEmail?: string;
  reportEmail?: string;
  contactPhone?: string;
  contactMobile?: string;
  contactFax?: string;
  band?: string;
  isSuspended?: boolean;
};

export type CustomersListResponse = {
  data: CustomerRecord[];
  total?: number;
  page?: number;
  limit?: number;
};

export type CustomersListQuery = {
  includeSuspended?: boolean;
  page?: number;
  limit?: number;
};

export type CreateCustomerPayload = {
  companyName: string;
  accountNumber?: string;
  centreNumber?: string;
  invBuildingName?: string;
  invAddressLn1?: string;
  invAddressLn2?: string;
  invTownOrCity?: string;
  invCounty?: string;
  invPostCode?: string;
  contactName?: string;
  contactEmail?: string;
  reportEmail?: string;
  contactPhone?: string;
  contactMobile?: string;
  contactFax?: string;
  band?: string;
};

export type UpdateCustomerPayload = Partial<Omit<CustomerRecord, 'customerId' | 'isSuspended'>>;

export type Address = {
  id: number;
  siteCompanyName?: string;
  delBuildingName?: string;
  delAddressLn1?: string;
  delAddressLn2?: string;
  delTownOrCity?: string;
  delCounty?: string;
  delPostCode?: string;
  siteContactName?: string;
  siteContactEmail?: string;
  siteContactPhone?: string;
  siteContactMobile?: string;
  defaultAddress?: boolean;
};

export type AddressesResponse = {
  data?: Address[];
};

type RequestConfig = {
  signal?: AbortSignal;
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function buildUrlWithQuery(baseUrl: string, query?: Record<string, unknown>): string {
  if (!query) {
    return baseUrl;
  }

  const url = new URL(baseUrl);

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    url.searchParams.set(key, String(value));
  });

  return url.toString();
}

// ── API functions ──────────────────────────────────────────────────────────────

export function listCustomers(
  query?: CustomersListQuery,
  requestConfig?: RequestConfig
): Promise<CustomersListResponse> {
  return apiRequest<CustomersListResponse>(
    buildUrlWithQuery(ENDPOINTS.customers.list, query as Record<string, unknown>),
    { method: 'GET', requireAuth: true, signal: requestConfig?.signal }
  );
}

export function getCustomer(id: number, requestConfig?: RequestConfig): Promise<CustomerRecord> {
  return apiRequest<CustomerRecord>(ENDPOINTS.customers.byId(id), {
    method: 'GET',
    requireAuth: true,
    signal: requestConfig?.signal,
  });
}

export function createCustomer(payload: CreateCustomerPayload): Promise<CustomerRecord> {
  return apiRequest<CustomerRecord>(ENDPOINTS.customers.list, {
    method: 'POST',
    requireAuth: true,
    body: payload,
  });
}

export function updateCustomer(id: number, payload: UpdateCustomerPayload): Promise<CustomerRecord> {
  return apiRequest<CustomerRecord>(ENDPOINTS.customers.byId(id), {
    method: 'PUT',
    requireAuth: true,
    body: payload,
  });
}

export function suspendCustomer(id: number): Promise<CustomerRecord> {
  return apiRequest<CustomerRecord>(ENDPOINTS.customers.suspend(id), {
    method: 'PATCH',
    requireAuth: true,
  });
}

export function reinstateCustomer(id: number): Promise<CustomerRecord> {
  return apiRequest<CustomerRecord>(ENDPOINTS.customers.reinstate(id), {
    method: 'PATCH',
    requireAuth: true,
  });
}

export function listAddresses(
  customerId: number,
  requestConfig?: RequestConfig
): Promise<AddressesResponse> {
  return apiRequest<AddressesResponse>(ENDPOINTS.customers.addresses(customerId), {
    method: 'GET',
    requireAuth: true,
    signal: requestConfig?.signal,
  });
}
