export interface MediaFormat {
  quality: string; // e.g., '1080p', '720p', 'Audio 128kbps'
  type: 'audio' | 'both';
  url: string;
  ext: string; // e.g., 'mp4', 'mp3', 'm4a'
  size?: string; // formatted size e.g. "12.4 MB"
  downloadUrl?: string; // Direct download streaming route path
}

export interface MediaMetadata {
  success: boolean;
  platform: string;
  title: string;
  thumbnail: string;
  duration: string; // MM:SS or HH:MM:SS
  uploader: string;
  formats: MediaFormat[];
}
