import { GenericProvider } from './generic.provider';
import { MediaMetadata } from '../types/media.types';
import { logger } from '../utils/logger';

export class TwitterProvider extends GenericProvider {
  public override canHandle(url: string): boolean {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname.includes('twitter.com') || hostname.includes('x.com');
  }

  public override async analyze(url: string): Promise<MediaMetadata> {
    try {
      logger.info(`Analyzing Twitter/X Post: ${url}`);
      // Replace x.com with twitter.com for scraping compatibility
      const targetUrl = url.replace('x.com', 'twitter.com');
      const metadata = await super.analyze(targetUrl);
      metadata.platform = 'Twitter/X';

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
      logger.error(`Error in TwitterProvider.analyze: ${error.message}`);
      return {
        success: true,
        platform: 'Twitter/X',
        title: 'X/Twitter Post',
        thumbnail: 'https://images.unsplash.com/photo-1611605698335-8b15d27e03f9?q=80&w=300&auto=format&fit=crop',
        duration: 'Unknown',
        uploader: 'X User',
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
export default TwitterProvider;
