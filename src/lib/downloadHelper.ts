/**
 * Unified client-side download utility for passes, certificates, and media.
 * Handles blob conversion, proper filename attribution, progress tracking,
 * and memory cleanup via URL.revokeObjectURL.
 */

export interface DownloadOptions {
  filename?: string;
  onProgress?: (progress: number) => void;
  onError?: (error: Error) => void;
}

export async function downloadFile(
  url: string,
  suggestedFilename?: string,
  options?: DownloadOptions
): Promise<boolean> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to download file (Status ${res.status}: ${res.statusText})`);
    }

    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    // Determine filename from suggested name or Content-Disposition or URL path
    let filename = suggestedFilename;
    if (!filename) {
      const disposition = res.headers.get('Content-Disposition');
      if (disposition && disposition.includes('filename=')) {
        const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match && match[1]) {
          filename = match[1].replace(/['"]/g, '').trim();
        }
      }
    }
    if (!filename) {
      filename = url.split('/').pop()?.split('?')[0] || 'download';
    }

    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', filename);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    }, 200);

    return true;
  } catch (err: any) {
    console.error('Download error:', err);
    if (options?.onError) {
      options.onError(err);
    }
    return false;
  }
}

/**
 * Helper to download an Entry Pass in PDF, PNG, or JPG format.
 */
export async function downloadPass(
  passId: string,
  format: 'pdf' | 'png' | 'jpg' = 'pdf',
  studentName?: string
): Promise<boolean> {
  const safeName = (studentName || 'Student').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `IEDC_Pass_${safeName}.${format}`;
  const url = `/api/public/registrations/${passId}/pass/${format}`;
  return downloadFile(url, filename);
}

/**
 * Helper to download an official Certificate in PDF, PNG, or JPG format.
 */
export async function downloadCertificate(
  certificateId: string,
  format: 'pdf' | 'png' | 'jpg' = 'pdf',
  participantName?: string
): Promise<boolean> {
  const safeName = (participantName || certificateId).replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `IEDC_Certificate_${safeName}.${format}`;
  const url = `/api/public/certificates/${certificateId}/${format}`;
  return downloadFile(url, filename);
}

