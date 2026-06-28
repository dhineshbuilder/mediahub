import { MediaMetadata } from '../types/media';
import { CaptionResult } from '../types/caption';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function analyzeMedia(url: string): Promise<MediaMetadata> {
  const response = await fetch(`${API_URL}/api/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || 'Failed to analyze URL. Please check the link and try again.');
  }

  return response.json();
}

export async function downloadMedia(
  url: string,
  quality: string,
  type: 'audio' | 'both',
  onProgress?: (percent: number) => void
): Promise<void> {
  const response = await fetch(`${API_URL}/api/download`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url, quality, type }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || 'Failed to initiate download streaming from backend.');
  }

  // Handle stream reader to report downloading progress in the UI
  const contentType = response.headers.get('content-type') || 'application/octet-stream';
  const disposition = response.headers.get('content-disposition');
  const contentLength = response.headers.get('content-length');
  const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

  let filename = type === 'audio' ? 'mediahub-audio.mp3' : 'mediahub-video.mp4';
  if (disposition && disposition.includes('filename=')) {
    const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (match && match[1]) {
      filename = decodeURIComponent(match[1].replace(/['"]/g, ''));
    }
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Readable stream not supported in this browser.');
  }

  let receivedBytes = 0;
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    if (value) {
      chunks.push(value);
      receivedBytes += value.length;
      if (totalBytes > 0 && onProgress) {
        onProgress(Math.min(99, Math.round((receivedBytes / totalBytes) * 100)));
      }
    }
  }

  if (onProgress) onProgress(100);

  // Combine chunks into a single blob
  const blob = new Blob(chunks as BlobPart[], { type: contentType });
  const blobUrl = window.URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  document.body.removeChild(a);
  window.URL.revokeObjectURL(blobUrl);
}

export async function generateCaptions(file: File): Promise<CaptionResult> {
  const formData = new FormData();
  formData.append('mediaFile', file);

  const response = await fetch(`${API_URL}/api/captions/generate`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || 'Failed to generate captions.');
  }

  return response.json();
}
