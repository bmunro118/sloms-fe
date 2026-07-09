import { apiRequest } from '@utils/api';
import { ENDPOINTS } from '@utils/config';

export type ScanLabelsResponse = {
  text: string;
};

export type ScanLabelsPayload = {
  image?: string;
  label?: string;
};

/**
 * Dummy OCR function - returns empty response
 * No real backend calls at this stage
 */
export async function scanLabelsApi(payload?: ScanLabelsPayload): Promise<ScanLabelsResponse> {
  // Dummy OCR - would log: '[scanLabelsApi] dummy OCR call with payload:', payload
  return { text: '' };
}

/**
 * Real API call (for future use when backend is implemented)
 */
export async function scanLabels(payload?: ScanLabelsPayload): Promise<ScanLabelsResponse> {
  return apiRequest<ScanLabelsResponse>(ENDPOINTS.scanLabels, {
    method: 'POST',
    requireAuth: true,
    body: payload,
  });
}
