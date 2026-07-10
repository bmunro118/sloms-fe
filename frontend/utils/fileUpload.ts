/**
 * File upload utilities for building FormData payloads from image URIs.
 * Handles both mobile (expo-camera) and web file URI formats.
 */

/**
 * Derives filename and MIME type from a photo URI.
 * Handles expo-camera URIs (file:// or cache://) and web file paths.
 */
export function getFileInfo(photoUri: string): { name: string; type: string } {
  // Extract filename from URI path
  let name = 'label-photo';
  let type = 'image/jpeg';

  try {
    // Try to extract filename from URI
    const lastSlash = photoUri.lastIndexOf('/');
    const lastBackslash = photoUri.lastIndexOf('\\');
    const start = Math.max(lastSlash, lastBackslash) + 1;
    
    if (start > 0 && start < photoUri.length) {
      const filenameWithQuery = photoUri.slice(start);
      // Remove query parameters if present
      const queryIndex = filenameWithQuery.indexOf('?');
      name = queryIndex > -1 ? filenameWithQuery.slice(0, queryIndex) : filenameWithQuery;
    }

    // Determine MIME type from file extension
    const extensionMatch = name.toLowerCase().match(/\.([a-z0-9]+)$/);
    if (extensionMatch) {
      const ext = extensionMatch[1];
      switch (ext) {
        case 'jpg':
        case 'jpeg':
          type = 'image/jpeg';
          break;
        case 'png':
          type = 'image/png';
          break;
        case 'tiff':
          type = 'image/tiff';
          break;
        case 'bmp':
          type = 'image/bmp';
          break;
        case 'heif':
        case 'heic':
          type = 'image/heif';
          break;
        case 'pdf':
          type = 'application/pdf';
          break;
        default:
          type = 'image/jpeg';
      }
    }
  } catch {
    // Fall back to defaults if extraction fails
  }

  return { name, type };
}

/**
 * Creates a FormData payload for label image upload.
 * The backend expects a multipart/form-data body with a single 'file' field.
 */
export function createLabelFormData(photoUri: string): FormData {
  const formData = new FormData();
  const { name, type } = getFileInfo(photoUri);

  // In React Native, we use the URI directly as the file reference
  // In a real fetch call, React Native's fetch polyfill handles the file resolution
  // For web, photoUri is typically a blob: URL or file path
  
  // Create a file-like object for the FormData
  // On native, the URI will be handled by the fetch polyfill
  // On web, the URI should be a blob URL that can be fetched
  
  // For expo-camera, the URI is a file:// URI on native
  // For web, it's typically a blob: URL
  
  // We'll append the URI as-is; the fetch implementation will resolve it
  // The backend receives this as the 'file' field in multipart form data
  
  // Create a file entry with proper metadata
  const fileEntry = {
    uri: photoUri,
    name: name,
    type: type,
  } as unknown as Blob;

  formData.append('file', fileEntry, name);

  return formData;
}
