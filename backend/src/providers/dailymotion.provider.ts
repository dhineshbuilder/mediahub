import axios from 'axios';
import { GenericProvider } from './generic.provider';
import { MediaMetadata } from '../types/media.types';
import { formatDuration } from '../utils/duration.formatter';
import { logger } from '../utils/logger';
import { AppError } from '../utils/error.formatter';

export class DailymotionProvider extends GenericProvider {
  public override canHandle(url: string): boolean {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname.includes('dailymotion.com') || hostname.includes('dai.ly');
  }

  private extractVideoId(url: string): string | null {
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes('dai.ly')) {
        return parsed.pathname.substring(1);
      }
      const match = parsed.pathname.match(/\/video\/([a-zA-Z0-9]+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }

  public override async analyze(url: string): Promise<MediaMetadata> {
    const videoId = this.extractVideoId(url);
    if (!videoId) {
      return super.analyze(url);
    }

    try {
      logger.info(`Analyzing Dailymotion Video: ${videoId}`);
      const apiUrl = `https://api.dailymotion.com/video/${videoId}?fields=title,thumbnail_720_url,duration,owner.username,url`;
      
      const response = await axios.get(apiUrl, {
        headers: { 'User-Agent': this.userAgent },
        timeout: 5000,
      });

      const data = response.data;
      if (!data || data.error) {
        throw new AppError(data.error?.message || 'Video not found on Dailymotion API.', 404);
      }

      const title = data.title || 'Dailymotion Video';
      const uploader = data['owner.username'] || 'Dailymotion User';
      const thumbnail = data.thumbnail_720_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300&auto=format&fit=crop';
      const durationSec = data.duration ? parseInt(data.duration, 10) : 0;

      // Provide direct source link
      const formats = [
        {
          quality: 'Source Stream (MP4)',
          type: 'both' as const,
          url: data.url || url,
          ext: 'mp4',
        },
      ];

      return {
        success: true,
        platform: 'Dailymotion',
        title: this.cleanHtmlEntities(title),
        thumbnail,
        duration: formatDuration(durationSec),
        uploader: this.cleanHtmlEntities(uploader),
        formats,
      };
    } catch (error: any) {
      logger.error(`Error in DailymotionProvider.analyze: ${error.message}`);
      const metadata = await super.analyze(url);
      metadata.platform = 'Dailymotion';
      return metadata;
    }
  }
}
export default DailymotionProvider;
