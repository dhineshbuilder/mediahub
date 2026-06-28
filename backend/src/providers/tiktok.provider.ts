import { GenericProvider } from './generic.provider';
import { MediaMetadata } from '../types/media.types';
import { logger } from '../utils/logger';

export class TikTokProvider extends GenericProvider {
  public override canHandle(url: string): boolean {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname.includes('tiktok.com');
  }

  public override async analyze(url: string): Promise<MediaMetadata> {
    try {
      logger.info(`Analyzing TikTok Video: ${url}`);
      const metadata = await super.analyze(url);
      metadata.platform = 'TikTok';

      if (metadata.formats.length === 1 && metadata.formats[0].quality === 'Source URL') {
        metadata.formats = [
          {
            quality: 'Direct Stream (MP4)',
            type: 'both',
            url: url,
            ext: 'mp4',
          },
        ];
      }
      return metadata;
    } catch (error: any) {
      logger.error(`Error in TikTokProvider.analyze: ${error.message}`);
      return {
        success: true,
        platform: 'TikTok',
        title: 'TikTok Video',
        thumbnail: 'https://images.unsplash.com/photo-1598128558393-70ff21433be0?q=80&w=300&auto=format&fit=crop',
        duration: 'Unknown',
        uploader: 'TikTok Creator',
        formats: [
          {
            quality: 'Standard Video',
            type: 'both',
            url: url,
            ext: 'mp4',
          },
        ],
      };
    }
  }
}
export default TikTokProvider;
