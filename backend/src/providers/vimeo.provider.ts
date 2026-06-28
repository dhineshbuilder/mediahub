import axios from 'axios';
import { GenericProvider } from './generic.provider';
import { MediaMetadata } from '../types/media.types';
import { formatDuration } from '../utils/duration.formatter';
import { logger } from '../utils/logger';
import { AppError } from '../utils/error.formatter';

export class VimeoProvider extends GenericProvider {
  public override canHandle(url: string): boolean {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname.includes('vimeo.com');
  }

  private extractVideoId(url: string): string | null {
    try {
      const parsed = new URL(url);
      const match = parsed.pathname.match(/(?:\/channels\/(?:\w+\/)?|\/groups\/([^\/]*)\/videos\/|\/showcase\/\d+\/video\/|\/video\/|\/|^\/)(\d+)(?:\b|\?)/);
      return match ? match[2] : null;
    } catch {
      return null;
    }
  }

  public override async analyze(url: string): Promise<MediaMetadata> {
    const videoId = this.extractVideoId(url);
    if (!videoId) {
      // Fall back to scraping webpage
      return super.analyze(url);
    }

    try {
      logger.info(`Analyzing Vimeo Video: ${videoId}`);
      const apiUrl = `https://vimeo.com/api/v2/video/${videoId}.json`;
      
      const response = await axios.get(apiUrl, {
        headers: { 'User-Agent': this.userAgent },
        timeout: 5000,
      });

      const data = response.data?.[0];
      if (!data) {
        throw new AppError('Video metadata not found on Vimeo public API.', 404);
      }

      const title = data.title || 'Vimeo Video';
      const uploader = data.user_name || 'Vimeo Creator';
      const thumbnail = data.thumbnail_large || data.thumbnail_medium || data.thumbnail_small;
      const durationSec = data.duration ? parseInt(data.duration, 10) : 0;

      // In production Vimeo, standard public API won't expose direct download links,
      // so we use the player page fallback URL or embed config if possible, or stream the source page.
      const formats = [
        {
          quality: 'HD Stream (MP4)',
          type: 'both' as const,
          url: `https://player.vimeo.com/video/${videoId}`,
          ext: 'mp4',
        },
      ];

      return {
        success: true,
        platform: 'Vimeo',
        title: this.cleanHtmlEntities(title),
        thumbnail,
        duration: formatDuration(durationSec),
        uploader: this.cleanHtmlEntities(uploader),
        formats,
      };
    } catch (error: any) {
      logger.error(`Error in VimeoProvider.analyze: ${error.message}`);
      // Scraper fallback
      const metadata = await super.analyze(url);
      metadata.platform = 'Vimeo';
      return metadata;
    }
  }
}
export default VimeoProvider;
