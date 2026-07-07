import { apiRequest } from '@utils/api';
import { ENDPOINTS } from '@utils/config';

// ── Types ──────────────────────────────────────────────────────────────────────

export type VatRate = {
  vatRateId: number;
  rate: number | { s: number; e: number; d: number[] };
  label?: string;
  validFrom: string;
  validTo?: string | null;
};

export function parseVatRate(rate: VatRate['rate']): number | null {
  if (typeof rate === 'number') return Number.isFinite(rate) ? rate : null;
  if (typeof rate === 'object' && rate !== null && 'd' in rate && Array.isArray(rate.d)) {
    const e: number = (rate as { e: number }).e ?? 0;
    const digits: number[] = rate.d;
    const str = digits.map((chunk, i) => i === 0 ? String(chunk) : String(chunk).padStart(7, '0')).join('');
    const integerLen = e + 1;
    const padded = str.padEnd(integerLen, '0');
    const intPart = padded.slice(0, integerLen);
    const fracPart = padded.slice(integerLen);
    const n = Number(fracPart.length > 0 ? `${intPart}.${fracPart}` : intPart);
    return Number.isFinite(n) ? n : null;
  }
  const n = Number(rate);
  return Number.isFinite(n) ? n : null;
}

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
