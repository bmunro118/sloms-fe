import { cacheDirectory, downloadAsync } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getStoredAccessToken, usesCookieAuth } from '@utils/auth';

export type CsvExportResult = {
  fileUri: string;
  shared: boolean;
};

export async function downloadAndShareCsvNative(
  downloadUrl: string,
  fileName: string
): Promise<CsvExportResult> {
  if (!cacheDirectory) {
    throw new Error('File cache directory is unavailable on this device.');
  }

  const requestHeaders: Record<string, string> = {};
  if (!usesCookieAuth()) {
    const token = await getStoredAccessToken();
    if (!token) {
      throw new Error('No active access token found for CSV export.');
    }
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const targetUri = `${cacheDirectory}${Date.now()}-${fileName}`;
  const downloadResult = await downloadAsync(downloadUrl, targetUri, {
    headers: requestHeaders,
  });

  const sharingAvailable = await Sharing.isAvailableAsync();
  if (sharingAvailable) {
    await Sharing.shareAsync(downloadResult.uri, {
      mimeType: 'text/csv',
      dialogTitle: 'Share price list CSV',
      UTI: 'public.comma-separated-values-text',
    });
  }

  return { fileUri: downloadResult.uri, shared: sharingAvailable };
}
