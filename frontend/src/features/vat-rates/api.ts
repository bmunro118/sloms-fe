import { apiRequest } from '@utils/api';
import { ENDPOINTS } from '@utils/config';

// ── Types ──────────────────────────────────────────────────────────────────────

export type VatRate = {
  id: number;
  rate: number;
  label?: string;
  validFrom: string;
  validTo?: string | null;
};

export type VatRateListResponse = {
  data: VatRate[];
  total?: number;
  page?: number;
  limit?: number;
};

export type CreateVatRatePayload = {
  rate: number;
  label?: string;
  validFrom: string;
};

export type CloseVatRatePayload = {
  validTo: string;
};

type RequestConfig = {
  signal?: AbortSignal;
};

// ── API functions ──────────────────────────────────────────────────────────────

export function listVatRates(requestConfig?: RequestConfig): Promise<VatRateListResponse> {
  return apiRequest<VatRateListResponse>(ENDPOINTS.vatRates.list, {
    method: 'GET',
    requireAuth: true,
    signal: requestConfig?.signal,
  });
}

export function getCurrentVatRate(requestConfig?: RequestConfig): Promise<VatRate> {
  return apiRequest<VatRate>(ENDPOINTS.vatRates.current, {
    method: 'GET',
    requireAuth: true,
    signal: requestConfig?.signal,
  });
}

export function createVatRate(payload: CreateVatRatePayload): Promise<VatRate> {
  return apiRequest<VatRate>(ENDPOINTS.vatRates.list, {
    method: 'POST',
    requireAuth: true,
    body: payload,
  });
}

export function closeVatRate(id: number, payload: CloseVatRatePayload): Promise<VatRate> {
  return apiRequest<VatRate>(ENDPOINTS.vatRates.close(id), {
    method: 'PATCH',
    requireAuth: true,
    body: payload,
  });
}
