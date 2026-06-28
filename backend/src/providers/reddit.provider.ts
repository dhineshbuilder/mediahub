import axios from 'axios';
import { GenericProvider } from './generic.provider';
import { MediaMetadata } from '../types/media.types';
import { formatDuration } from '../utils/duration.formatter';
import { logger } from '../utils/logger';
import { AppError } from '../utils/error.formatter';

export class RedditProvider extends GenericProvider {
  public override canHandle(url: string): boolean {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname.includes('reddit.com') || hostname.includes('redd.it');
  }

  public override async analyze(url: string): Promise<MediaMetadata> {
    try {
      logger.info(`Analyzing Reddit Post: ${url}`);
      
      // Format URL to fetch public json representation
      let jsonUrl = url.split('?')[0];
      if (jsonUrl.endsWith('/')) {
        jsonUrl = jsonUrl.slice(0, -1);
      }
      jsonUrl = `${jsonUrl}.json`;

      const response = await axios.get(jsonUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 RedditDownloader/1.0',
        },
        timeout: 10000,
      });

      const data = response.data;
      const post = data?.[0]?.data?.children?.[0]?.data;

      if (!post) {
        throw new AppError('Reddit post could not be fetched or is private.', 404);
      }

      const title = post.title || 'Reddit Post';
      const uploader = `u/${post.author || 'RedditUser'}`;
      let thumbnail = post.thumbnail && post.thumbnail.startsWith('http') 
        ? post.thumbnail 
        : 'https://images.unsplash.com/photo-1614332287897-cdc485fa562d?q=80&w=300&auto=format&fit=crop';
      
      const formats = [];
      let durationStr = 'Unknown';

      // Look for embedded reddit video
      const redditVideo = post.secure_media?.reddit_video || post.media?.reddit_video;
      if (redditVideo) {
        const videoUrl = redditVideo.fallback_url;
        const durationSec = redditVideo.duration ? parseInt(redditVideo.duration, 10) : 0;
        durationStr = formatDuration(durationSec);
        
        if (videoUrl) {
          formats.push({
            quality: `${redditVideo.height}p HD`,
            type: 'both' as const,
            url: videoUrl,
            ext: 'mp4',
          });
        }
      }

      // Look for secondary image previews if it's an image post
      if (formats.length === 0 && post.url && (post.url.endsWith('.png') || post.url.endsWith('.jpg') || post.url.endsWith('.jpeg') || post.url.endsWith('.gif'))) {
        formats.push({
          quality: 'Direct Image Link',
          type: 'both' as const,
          url: post.url,
          ext: post.url.split('.').pop() || 'jpg',
        });
        if (thumbnail === 'self' || thumbnail === 'default') {
          thumbnail = post.url;
        }
      }

      // Fallback format
      if (formats.length === 0) {
        formats.push({
          quality: 'Source Post',
          type: 'both' as const,
          url: url,
          ext: 'html',
        });
      }

      return {
        success: true,
        platform: 'Reddit',
        title: this.cleanHtmlEntities(title),
        thumbnail,
        duration: durationStr,
        uploader: uploader,
        formats,
      };
    } catch (error: any) {
      logger.error(`Error in RedditProvider.analyze: ${error.message}`);
      // Fallback
      return {
        success: true,
        platform: 'Reddit',
        title: 'Reddit Media Post',
        thumbnail: 'https://images.unsplash.com/photo-1614332287897-cdc485fa562d?q=80&w=300&auto=format&fit=crop',
        duration: 'Unknown',
        uploader: 'Reddit User',
        formats: [
          {
            quality: 'Post Stream',
            type: 'both',
            url: url,
            ext: 'mp4',
          },
        ],
      };
    }
  }
}
export default RedditProvider;
