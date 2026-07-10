import { apiRequest } from '@utils/api';
import { ENDPOINTS } from '@utils/config';
import { createLabelFormData } from '@utils/fileUpload';
import type { ScanLabelFromImageResponse } from './types';

/**
 * Scans a label from an image and returns structured extraction data.
 * When dryRun is true, performs extraction only without creating an item.
 * When dryRun is false, creates the item on the order using the extracted data.
 */
export async function scanLabelFromImage(
  orderNumber: number,
  orderBatch: number,
  photoUri: string,
  dryRun = false,
): Promise<ScanLabelFromImageResponse> {
  const formData = createLabelFormData(photoUri);
  
  const url = ENDPOINTS.orders.fromLabel(orderNumber, orderBatch);
  const searchParams = new URLSearchParams({ dryRun: String(dryRun) });
  const fullUrl = `${url}?${searchParams.toString()}`;

  return apiRequest<ScanLabelFromImageResponse>(fullUrl, {
    method: 'POST',
    requireAuth: true,
    body: formData,
  });
}
