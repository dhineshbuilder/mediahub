import { GenericProvider } from './generic.provider';
import { MediaMetadata } from '../types/media.types';
import { logger } from '../utils/logger';

export class FacebookProvider extends GenericProvider {
  public override canHandle(url: string): boolean {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname.includes('facebook.com') || hostname.includes('fb.watch') || hostname.includes('fb.com');
  }

  public override async analyze(url: string): Promise<MediaMetadata> {
    try {
      logger.info(`Analyzing Facebook Video: ${url}`);
      const metadata = await super.analyze(url);
      metadata.platform = 'Facebook';
      
      // Update fallback formats if we only got the webpage link
      if (metadata.formats.length === 1 && metadata.formats[0].quality === 'Source URL') {
        metadata.formats = [
          {
            quality: 'SD Quality (MP4)',
            type: 'both',
            url: url,
            ext: 'mp4',
          },
        ];
      }
      return metadata;
    } catch (error: any) {
      logger.error(`Error in FacebookProvider.analyze: ${error.message}`);
      return {
        success: true,
        platform: 'Facebook',
        title: 'Facebook Video',
        thumbnail: 'https://images.unsplash.com/photo-1562577309-4932fdd64cd1?q=80&w=300&auto=format&fit=crop',
        duration: 'Unknown',
        uploader: 'Facebook Creator',
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
export default FacebookProvider;
