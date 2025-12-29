import type { UploadFileResult } from './types';

const API_STORAGE_UPLOAD = '/api/storage/upload';

/**
 * Uploads a file from the browser to the storage provider
 * This function is meant to be used in client components
 *
 * Note: Since s3mini doesn't support presigned URLs, all uploads
 * go through the direct upload API endpoint regardless of file size.
 *
 * @param file - The file object from an input element
 * @param folder - Optional folder path to store the file in
 * @returns Promise with the URL of the uploaded file
 */
export const uploadFileFromBrowser = async (
  file: File,
  folder?: string
): Promise<UploadFileResult> => {
  try {
    // With s3mini, we use direct upload for all file sizes
    // since presigned URLs are not supported
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder || '');

    const response = await fetch(API_STORAGE_UPLOAD, {
      method: 'POST',
      body: formData,
    });

    console.log('uploadFileFromBrowser, response', response);

    if (!response.ok) {
      // Handle 413 error specifically (Request Entity Too Large)
      if (response.status === 413) {
        throw new Error('File size exceeds the server limit');
      }

      // Try to parse JSON error response, fallback to status text if parsing fails
      let errorMessage = 'Failed to upload file';
      try {
        const errorData = (await response.json()) as {
          error?: string;
          message?: string;
        };
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        errorMessage = 'Failed to upload file';
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unknown error occurred during file upload';
    throw new Error(message);
  }
};
