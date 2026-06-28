import axios from 'axios';
import { Provider, ProviderResponse } from './provider.interface';
import { MediaMetadata, MediaFormat } from '../types/media.types';
import { AppError } from '../utils/error.formatter';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export class GenericProvider implements Provider {
  protected userAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  public canHandle(_url: string): boolean {
    // Falls back to true since it handles generic URLs
    return true;
  }

  public async analyze(url: string): Promise<MediaMetadata> {
    try {
      // If the URL directly points to a media file, handle it directly
      const lowerUrl = url.toLowerCase();
      if (
        lowerUrl.endsWith('.mp4') ||
        lowerUrl.endsWith('.webm') ||
        lowerUrl.endsWith('.mp3') ||
        lowerUrl.endsWith('.m4a') ||
        lowerUrl.endsWith('.wav')
      ) {
        const isAudio = lowerUrl.endsWith('.mp3') || lowerUrl.endsWith('.m4a') || lowerUrl.endsWith('.wav');
        const ext = url.split('.').pop()?.split('?')[0] || (isAudio ? 'mp3' : 'mp4');
        return {
          success: true,
          platform: 'Direct Link',
          title: url.split('/').pop()?.split('?')[0] || 'Direct Media',
          thumbnail: isAudio
            ? 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=300&auto=format&fit=crop'
            : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=300&auto=format&fit=crop',
          duration: 'Unknown',
          uploader: new URL(url).hostname,
          formats: [
            {
              quality: 'Direct Stream',
              type: isAudio ? 'audio' : 'both',
              url: url,
              ext: ext,
            },
          ],
        };
      }

      logger.info(`Analyzing generic page: ${url}`);
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        timeout: 10000,
      });

      const html = response.data;
      const title = this.extractMeta(html, [
        /<meta property="og:title" content="([^"]+)"/i,
        /<meta name="twitter:title" content="([^"]+)"/i,
        /<title>([^<]+)<\/title>/i,
      ]) || 'Webpage Media';

      const thumbnail = this.extractMeta(html, [
        /<meta property="og:image" content="([^"]+)"/i,
        /<meta name="twitter:image" content="([^"]+)"/i,
      ]) || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300&auto=format&fit=crop';

      const uploader = this.extractMeta(html, [
        /<meta name="author" content="([^"]+)"/i,
        /<meta property="og:site_name" content="([^"]+)"/i,
      ]) || new URL(url).hostname;

      // Format search
      const formats: MediaFormat[] = [];
      
      const videoUrl = this.extractMeta(html, [
        /<meta property="og:video:url" content="([^"]+)"/i,
        /<meta property="og:video:secure_url" content="([^"]+)"/i,
        /<meta property="og:video" content="([^"]+)"/i,
        /<video[^>]+src="([^"]+)"/i,
      ]);

      if (videoUrl) {
        formats.push({
          quality: 'Default Video',
          type: 'both',
          url: this.resolveUrl(url, videoUrl),
          ext: 'mp4',
        });
      }

      const audioUrl = this.extractMeta(html, [
        /<audio[^>]+src="([^"]+)"/i,
        /<source[^>]+src="([^"]+\.(?:mp3|wav|m4a|ogg))"/i,
      ]);

      if (audioUrl) {
        formats.push({
          quality: 'Default Audio',
          type: 'audio',
          url: this.resolveUrl(url, audioUrl),
          ext: 'mp3',
        });
      }

      // Add a fallback format using the URL itself in case standard tags failed but it contains video embeddings
      if (formats.length === 0) {
        formats.push({
          quality: 'Source URL',
          type: 'both',
          url: url,
          ext: 'html',
        });
      }

      return {
        success: true,
        platform: 'Webpage',
        title: this.cleanHtmlEntities(title),
        thumbnail,
        duration: 'Unknown',
        uploader: this.cleanHtmlEntities(uploader),
        formats,
      };
    } catch (error: any) {
      logger.error(`Error in GenericProvider.analyze: ${error.message}`);
      throw new AppError(`Failed to fetch media metadata from ${url}`, 400);
    }
  }

  public async download(
    url: string,
    _quality: string,
    type: 'audio' | 'both'
  ): Promise<ProviderResponse> {
    try {
      logger.info(`Starting download request from GenericProvider for URL: ${url}`);
      
      const response = await axios({
        method: 'get',
        url: url,
        headers: {
          'User-Agent': this.userAgent,
          Referer: new URL(url).origin,
        },
        responseType: 'stream',
        timeout: env.DOWNLOAD_TIMEOUT,
      });

      const parsedUrl = new URL(url);
      let filename = parsedUrl.pathname.split('/').pop() || 'download';
      if (!filename.includes('.')) {
        const ext = type === 'audio' ? 'mp3' : 'mp4';
        filename = `${filename}.${ext}`;
      }

      const contentType = String(response.headers['content-type'] || 'application/octet-stream');
      const sizeHeader = response.headers['content-length'];
      const size = sizeHeader ? parseInt(String(sizeHeader), 10) : undefined;

      return {
        stream: response.data,
        filename,
        contentType,
        size,
      };
    } catch (error: any) {
      logger.error(`Error in GenericProvider.download: ${error.message}`);
      throw new AppError(`Failed to stream media from source URL.`, 502);
    }
  }

  protected extractMeta(html: string, regexes: RegExp[]): string | null {
    for (const regex of regexes) {
      const match = html.match(regex);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return null;
  }

  protected resolveUrl(base: string, relative: string): string {
    if (relative.startsWith('http://') || relative.startsWith('https://')) {
      return relative;
    }
    try {
      return new URL(relative, base).toString();
    } catch {
      return relative;
    }
  }

  protected cleanHtmlEntities(str: string): string {
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&apos;/g, "'");
  }
}
export default GenericProvider;
