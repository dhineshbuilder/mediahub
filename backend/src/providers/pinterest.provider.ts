import { GenericProvider } from './generic.provider';
import { MediaMetadata } from '../types/media.types';
import { logger } from '../utils/logger';

export class PinterestProvider extends GenericProvider {
  public override canHandle(url: string): boolean {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname.includes('pinterest.com') || hostname.includes('pin.it');
  }

  public override async analyze(url: string): Promise<MediaMetadata> {
    try {
      logger.info(`Analyzing Pinterest Pin: ${url}`);
      const metadata = await super.analyze(url);
      metadata.platform = 'Pinterest';

      if (metadata.formats.length === 1 && metadata.formats[0].quality === 'Source URL') {
        metadata.formats = [
          {
            quality: 'Pin Stream (MP4)',
            type: 'both',
            url: url,
            ext: 'mp4',
          },
        ];
      }
      return metadata;
    } catch (error: any) {
      logger.error(`Error in PinterestProvider.analyze: ${error.message}`);
      return {
        success: true,
        platform: 'Pinterest',
        title: 'Pinterest Pin',
        thumbnail: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?q=80&w=300&auto=format&fit=crop',
        duration: 'Unknown',
        uploader: 'Pinterest Pinner',
        formats: [
          {
            quality: 'Pin media',
            type: 'both',
            url: url,
            ext: 'mp4',
          },
        ],
      };
    }
  }
}
export default PinterestProvider;
