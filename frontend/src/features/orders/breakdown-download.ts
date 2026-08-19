import { cacheDirectory, downloadAsync } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { getStoredAccessToken, usesCookieAuth } from '@utils/auth';

export type NativeBreakdownDownloadResult = {
  fileUri: string;
  shared: boolean;
};

export async function downloadAndShareBreakdownPdfNative(
  downloadUrl: string,
  fileName: string
): Promise<NativeBreakdownDownloadResult> {
  if (!cacheDirectory) {
    throw new Error('File cache directory is unavailable on this device.');
  }

  const requestHeaders: Record<string, string> = {};

  if (!usesCookieAuth()) {
    const token = await getStoredAccessToken();
    if (!token) {
      throw new Error('No active access token found for breakdown download.');
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
      mimeType: 'application/pdf',
      dialogTitle: 'Share order breakdown',
      UTI: 'com.adobe.pdf',
    });
  }

  return {
    fileUri: downloadResult.uri,
    shared: sharingAvailable,
  };
}
