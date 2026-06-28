import { MediaMetadata } from '../types/media.types';

export interface ProviderResponse {
  stream: NodeJS.ReadableStream;
  filename: string;
  contentType: string;
  size?: number;
}

export interface Provider {
  canHandle(url: string): boolean;
  analyze(url: string): Promise<MediaMetadata>;
  download(url: string, quality: string, type: 'audio' | 'both'): Promise<ProviderResponse>;
}
