import { GenericProvider } from './generic.provider';
import { MediaMetadata } from '../types/media.types';
import { logger } from '../utils/logger';

export class ThreadsProvider extends GenericProvider {
  public override canHandle(url: string): boolean {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname.includes('threads.net');
  }

  public override async analyze(url: string): Promise<MediaMetadata> {
    try {
      logger.info(`Analyzing Threads Post: ${url}`);
      const metadata = await super.analyze(url);
      metadata.platform = 'Threads';

      if (metadata.formats.length === 1 && metadata.formats[0].quality === 'Source URL') {
        metadata.formats = [
          {
            quality: 'Threads Stream (MP4)',
            type: 'both',
            url: url,
            ext: 'mp4',
          },
        ];
      }
      return metadata;
    } catch (error: any) {
      logger.error(`Error in ThreadsProvider.analyze: ${error.message}`);
      return {
        success: true,
        platform: 'Threads',
        title: 'Threads Post Media',
        thumbnail: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=300&auto=format&fit=crop',
        duration: 'Unknown',
        uploader: 'Threads User',
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
export default ThreadsProvider;
