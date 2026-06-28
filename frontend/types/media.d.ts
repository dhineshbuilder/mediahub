export interface MediaFormat {
  quality: string;
  type: 'audio' | 'both';
  url: string;
  ext: string;
  size?: string;
}

export interface MediaMetadata {
  success: boolean;
  platform: string;
  title: string;
  thumbnail: string;
  duration: string;
  uploader: string;
  formats: MediaFormat[];
}

export interface ToastMessage {
  id: string;
  title: string;
  description: string;
  type: 'success' | 'error' | 'info';
}
